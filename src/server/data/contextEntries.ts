/**
 * Reads for a Member's Context Ledger. This is where "scope enforcement
 * works at the query level, not just the UI" is actually exercised: a
 * Support Partner not currently active in a Member's circle gets an empty
 * array back from getContextEntries, never a 403 — the where-clause
 * itself excludes rows they have no standing to see, and visibility
 * (MEMBER_ONLY/CIRCLE/COHORT/ORG) narrows it further even for people who
 * do have standing.
 */
import { db } from "@/lib/db";
import type { ContextVisibility } from "@/generated/prisma/enums";
import type { SessionScope } from "@/server/data/scope";

async function resolveReadableVisibilities(
  scope: SessionScope,
  memberId: string,
): Promise<ContextVisibility[] | "OWN"> {
  if (scope.role === "MEMBER") {
    return scope.memberProfileId === memberId ? "OWN" : [];
  }

  if (scope.role === "SUPPORT_PARTNER" && scope.partnerProfileId) {
    const isActiveInCircle = await db.careCircleMembership.findFirst({
      where: {
        supportPartnerId: scope.partnerProfileId,
        status: "ACTIVE",
        careCircle: { memberId },
      },
    });
    return isActiveInCircle ? ["CIRCLE", "COHORT", "ORG"] : [];
  }

  if (scope.role === "PROFESSIONAL_LEAD" && scope.leadProfileId) {
    const member = await db.memberProfile.findFirst({
      where: { id: memberId, cohort: { leadId: scope.leadProfileId } },
    });
    return member ? ["COHORT", "ORG"] : [];
  }

  if (scope.role === "ORG_ADMIN") {
    const member = await db.memberProfile.findFirst({
      where: { id: memberId, cohort: { orgId: scope.orgId } },
    });
    return member ? ["ORG"] : [];
  }

  return [];
}

export async function getContextEntries(scope: SessionScope, memberId: string) {
  const readable = await resolveReadableVisibilities(scope, memberId);
  if (readable !== "OWN" && readable.length === 0) return [];

  return db.contextLedgerEntry.findMany({
    where: {
      memberId,
      isCurrent: true,
      ...(readable === "OWN" ? {} : { visibility: { in: readable } }),
    },
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
  });
}
