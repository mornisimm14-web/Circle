"use server";

/**
 * Org-level config actions. addSafetyKeywordAction/removeSafetyKeywordAction
 * are the only way OrgSafetyKeyword rows change — the whole point of the
 * config-driven principle is that safetyKeywords.ts (the rule engine) never
 * hardcodes a keyword list; it only ever reads this table.
 */
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionScope, requireRole } from "@/server/data/scope";

/**
 * A bare redirect("/admin/settings") on success can serve a stale
 * client-side prefetch of that same URL instead of the fresh state the
 * action just produced — the same stale-cache class of bug fixed for
 * post-login (Sprint 1) and every Capture mutation (Sprint 4). The
 * cache-busting query param sidesteps it.
 */
function freshSettingsPath() {
  return `/admin/settings?_r=${Date.now()}`;
}

export async function addSafetyKeywordAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "ORG_ADMIN");
  const keyword = (formData.get("keyword") as string)?.trim();
  const severity = formData.get("severity") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  if (!keyword) redirect(`/admin/settings?error=${encodeURIComponent("Keyword text is required")}`);

  await db.orgSafetyKeyword.create({
    data: { orgId: scope.orgId, keyword, severity },
  });

  redirect(freshSettingsPath());
}

export async function removeSafetyKeywordAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "ORG_ADMIN");
  const id = formData.get("id") as string;

  await db.orgSafetyKeyword.deleteMany({ where: { id, orgId: scope.orgId } });

  redirect(freshSettingsPath());
}
