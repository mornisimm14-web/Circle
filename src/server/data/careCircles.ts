/**
 * Care Circle reads for the Member and Support Partner dashboards. Every
 * query is filtered by SessionScope, not just by "is this role allowed to
 * see this screen" — a Partner querying another Partner's caseload gets
 * an empty list, not a 403, because the where-clause itself excludes it.
 */
import { db } from "@/lib/db";
import type { SessionScope } from "@/server/data/scope";

export async function getOwnCareCircle(scope: SessionScope) {
  if (scope.role !== "MEMBER" || !scope.memberProfileId) return null;

  return db.careCircle.findUnique({
    where: { memberId: scope.memberProfileId },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { roleInCircle: "asc" },
        include: { supportPartner: { include: { user: true } } },
      },
    },
  });
}

export async function getPartnerCaseload(scope: SessionScope) {
  if (scope.role !== "SUPPORT_PARTNER" || !scope.partnerProfileId) {
    return { caseloadCap: 0, memberships: [] };
  }

  const [profile, memberships] = await Promise.all([
    db.supportPartnerProfile.findUnique({ where: { id: scope.partnerProfileId } }),
    db.careCircleMembership.findMany({
      where: { supportPartnerId: scope.partnerProfileId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      include: { careCircle: { include: { member: { include: { user: true } } } } },
    }),
  ]);

  return { caseloadCap: profile?.caseloadCap ?? 0, memberships };
}
