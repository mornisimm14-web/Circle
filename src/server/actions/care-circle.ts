"use server";

/**
 * Mutations behind the Org Admin cohort/circle management screen. Every
 * action here requires ORG_ADMIN via requireRole() and goes through
 * server/data/scope.ts first — never a raw prisma.* call from a route.
 * "Exactly one ACTIVE PRIMARY per circle" is checked here at the
 * application level; the migration's partial unique index is the backstop
 * if this check is ever bypassed (a race, a bug, a future direct-SQL path).
 * Validation failures redirect back with ?error= (same pattern as
 * login.ts) instead of throwing, so the admin sees a message, not a
 * Next.js error overlay.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionScope, requireRole } from "@/server/data/scope";

export async function createCohortAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "ORG_ADMIN");
  const name = (formData.get("name") as string)?.trim();
  if (!name) redirect(`/admin/cohorts?error=${encodeURIComponent("Cohort name is required")}`);

  await db.cohort.create({ data: { orgId: scope.orgId, name } });
  revalidatePath("/admin/cohorts");
}

/**
 * Assigns a User (Member, Support Partner, or Professional Lead) to a
 * cohort — creating their role profile row on first assignment if it
 * doesn't exist yet, and for Members, their CareCircle too (1:1, always
 * needed once they're onboarded). The user's actual role, not whatever
 * the form claims, decides which profile table gets touched.
 */
export async function assignUserToCohortAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "ORG_ADMIN");
  const userId = formData.get("userId") as string;
  const cohortId = formData.get("cohortId") as string;

  const [user, cohort] = await Promise.all([
    db.user.findFirst({ where: { id: userId, orgId: scope.orgId } }),
    db.cohort.findFirst({ where: { id: cohortId, orgId: scope.orgId } }),
  ]);
  if (!user || !cohort) {
    redirect(`/admin/cohorts/${cohortId}?error=${encodeURIComponent("User or cohort not found")}`);
  }

  if (user.role === "MEMBER") {
    const memberProfile = await db.memberProfile.upsert({
      where: { userId },
      update: { cohortId },
      create: { userId, cohortId },
    });
    await db.careCircle.upsert({
      where: { memberId: memberProfile.id },
      update: {},
      create: { memberId: memberProfile.id },
    });
  } else if (user.role === "SUPPORT_PARTNER") {
    await db.supportPartnerProfile.upsert({
      where: { userId },
      update: { cohortId },
      create: { userId, cohortId },
    });
  } else if (user.role === "PROFESSIONAL_LEAD") {
    const leadProfile = await db.professionalLeadProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    await db.cohort.update({ where: { id: cohortId }, data: { leadId: leadProfile.id } });
  } else {
    redirect(`/admin/cohorts/${cohortId}?error=${encodeURIComponent("Org Admins are not assigned to cohorts")}`);
  }

  revalidatePath(`/admin/cohorts/${cohortId}`);
  revalidatePath("/admin/cohorts");
}

export async function assignPartnerToCircleAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "ORG_ADMIN");
  const careCircleId = formData.get("careCircleId") as string;
  const supportPartnerId = formData.get("supportPartnerId") as string;
  const roleInCircle = formData.get("roleInCircle") as "PRIMARY" | "SECONDARY";
  const cohortId = formData.get("cohortId") as string;

  const careCircle = await db.careCircle.findFirst({
    where: { id: careCircleId, member: { cohort: { orgId: scope.orgId } } },
  });
  if (!careCircle) {
    redirect(`/admin/cohorts/${cohortId}?error=${encodeURIComponent("Care circle not found")}`);
  }

  if (roleInCircle === "PRIMARY") {
    const existingPrimary = await db.careCircleMembership.findFirst({
      where: { careCircleId, roleInCircle: "PRIMARY", status: "ACTIVE" },
    });
    if (existingPrimary) {
      redirect(
        `/admin/cohorts/${cohortId}?error=${encodeURIComponent(
          "This circle already has an active PRIMARY partner — deactivate it first before assigning a new one.",
        )}`,
      );
    }
  }

  await db.careCircleMembership.create({
    data: { careCircleId, supportPartnerId, roleInCircle, status: "ACTIVE" },
  });

  revalidatePath(`/admin/cohorts/${cohortId}`);
}

export async function deactivateMembershipAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "ORG_ADMIN");
  const membershipId = formData.get("membershipId") as string;
  const cohortId = formData.get("cohortId") as string;

  const membership = await db.careCircleMembership.findFirst({
    where: { id: membershipId, careCircle: { member: { cohort: { orgId: scope.orgId } } } },
  });
  if (!membership) {
    redirect(`/admin/cohorts/${cohortId}?error=${encodeURIComponent("Membership not found")}`);
  }

  await db.careCircleMembership.update({ where: { id: membershipId }, data: { status: "INACTIVE" } });
  revalidatePath(`/admin/cohorts/${cohortId}`);
}
