/**
 * Cohort/roster reads for the Org Admin screen. Unlike careCircles.ts,
 * every function here requires ORG_ADMIN — an admin manages the whole
 * org's roster, so there's no per-row filtering beyond orgId.
 */
import { db } from "@/lib/db";
import type { SessionScope } from "@/server/data/scope";

function requireAdmin(scope: SessionScope) {
  if (scope.role !== "ORG_ADMIN") throw new Error("Forbidden");
}

export async function listCohorts(scope: SessionScope) {
  requireAdmin(scope);

  return db.cohort.findMany({
    where: { orgId: scope.orgId },
    orderBy: { createdAt: "asc" },
    include: {
      lead: { include: { user: true } },
      memberProfiles: true,
      supportPartners: true,
    },
  });
}

export async function listOrgUsers(scope: SessionScope) {
  requireAdmin(scope);

  return db.user.findMany({
    where: { orgId: scope.orgId },
    orderBy: { name: "asc" },
    include: {
      memberProfile: { include: { cohort: true, careCircle: true } },
      supportPartnerProfile: { include: { cohort: true } },
      professionalLeadProfile: { include: { cohort: true } },
    },
  });
}

export async function getCohortDetail(scope: SessionScope, cohortId: string) {
  requireAdmin(scope);

  return db.cohort.findFirst({
    where: { id: cohortId, orgId: scope.orgId },
    include: {
      lead: { include: { user: true } },
      memberProfiles: {
        include: {
          user: true,
          careCircle: {
            include: {
              memberships: {
                where: { status: "ACTIVE" },
                include: { supportPartner: { include: { user: true } } },
              },
            },
          },
        },
      },
      supportPartners: { include: { user: true } },
    },
  });
}
