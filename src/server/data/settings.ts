/**
 * Reads for /admin/settings — org-level config, starting with the
 * safety-keyword list the SURFACE step's rule engine reads at runtime.
 */
import { db } from "@/lib/db";
import type { SessionScope } from "@/server/data/scope";

export async function listSafetyKeywords(scope: SessionScope) {
  if (scope.role !== "ORG_ADMIN") return [];
  return db.orgSafetyKeyword.findMany({
    where: { orgId: scope.orgId },
    orderBy: { createdAt: "asc" },
  });
}
