/**
 * Single source of truth for "where does each role land" — used by proxy.ts
 * (hard-navigation / direct URL gating) and by the landing page itself
 * (soft-navigation bounce after a Server Action redirect, which middleware
 * alone does not reliably re-navigate for).
 */
import type { UserRole } from "@/generated/prisma/enums";

export const ROLE_HOME: Record<UserRole, string> = {
  MEMBER: "/member/dashboard",
  SUPPORT_PARTNER: "/partner/dashboard",
  PROFESSIONAL_LEAD: "/lead/review-queue",
  ORG_ADMIN: "/admin/cohorts",
};

export const ROLE_PATH_PREFIX: Record<UserRole, string> = {
  MEMBER: "/member",
  SUPPORT_PARTNER: "/partner",
  PROFESSIONAL_LEAD: "/lead",
  ORG_ADMIN: "/admin",
};
