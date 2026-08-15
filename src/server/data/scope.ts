/**
 * The actual RBAC boundary. Auth.js only proves *who* is signed in; every
 * data-layer function in server/data/*.ts takes a SessionScope (built once
 * here, from the session) and uses it to constrain its query — a Member
 * only ever sees their own circle, a Partner only circles they're an
 * active member of, a Lead only their cohort. Server Actions must call
 * requireRole() before touching the data layer; nothing outside this file
 * should read `session.user.role` directly to make an access decision.
 */
import { auth } from "@/server/auth/auth.config";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";

export type SessionScope = {
  userId: string;
  orgId: string;
  role: UserRole;
  memberProfileId: string | null;
  partnerProfileId: string | null;
  leadProfileId: string | null;
};

export async function getSessionScope(): Promise<SessionScope | null> {
  const session = await auth();
  if (!session?.user) return null;

  const { id: userId, orgId, role } = session.user;

  const [memberProfile, partnerProfile, leadProfile] = await Promise.all([
    role === "MEMBER" ? db.memberProfile.findUnique({ where: { userId } }) : null,
    role === "SUPPORT_PARTNER" ? db.supportPartnerProfile.findUnique({ where: { userId } }) : null,
    role === "PROFESSIONAL_LEAD" ? db.professionalLeadProfile.findUnique({ where: { userId } }) : null,
  ]);

  return {
    userId,
    orgId,
    role,
    memberProfileId: memberProfile?.id ?? null,
    partnerProfileId: partnerProfile?.id ?? null,
    leadProfileId: leadProfile?.id ?? null,
  };
}

export function requireRole(scope: SessionScope | null, ...roles: UserRole[]): SessionScope {
  if (!scope) throw new Error("Not authenticated");
  if (!roles.includes(scope.role)) throw new Error("Forbidden");
  return scope;
}
