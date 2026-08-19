/**
 * Config-driven safety-keyword matching — reads OrgSafetyKeyword (managed
 * at /admin/settings), never a hardcoded list. Case-insensitive substring
 * match against the approved summary text; simple by design so an admin
 * can reason about exactly what will and won't trigger a flag.
 */
import { db } from "@/lib/db";

export type SafetyKeywordMatch = { keyword: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" };

export async function checkSafetyKeywords(orgId: string, text: string): Promise<SafetyKeywordMatch[]> {
  const keywords = await db.orgSafetyKeyword.findMany({ where: { orgId } });
  const lowerText = text.toLowerCase();

  return keywords
    .filter((k) => lowerText.includes(k.keyword.toLowerCase()))
    .map((k) => ({ keyword: k.keyword, severity: k.severity }));
}
