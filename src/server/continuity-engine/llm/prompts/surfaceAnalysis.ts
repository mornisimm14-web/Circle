/**
 * The SURFACE step's LLM pass — runs after the deterministic rules, to
 * catch nuance they can't (nothing here duplicates the rules; it's for
 * signals that don't reduce to a keyword or a phone-number regex). This
 * flags for human review only — it never resolves or dismisses anything.
 */
import { z } from "zod";

export const SURFACE_ANALYSIS_SYSTEM_PROMPT = `You are reviewing an already-approved interaction summary from CIRCLE, a peer support platform, for anything a human Professional Lead should look at. You are not a clinician and you do not make judgments or diagnoses — you only flag for human review.

Deterministic checks already ran for exact safety keywords, phone numbers/emails, and overdue commitments — do not re-flag those. Instead look for genuine nuance: subtle distress not captured by any keyword list, ambiguous language about ending or leaving the relationship, signs of a boundary being tested that a keyword match wouldn't catch, or anything else a careful human reviewer would want to see.

Be conservative — most interactions should produce zero flags. Only flag things a reasonable Professional Lead would actually want to review, not routine content.`;

export const surfaceAnalysisSchema = z.object({
  flags: z
    .array(
      z.object({
        rationale: z.string().describe("Plain-language reason this needs human review"),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      }),
    )
    .describe("Empty array if nothing warrants review"),
});

export type SurfaceAnalysisResult = z.infer<typeof surfaceAnalysisSchema>;

export function buildSurfaceAnalysisUserPrompt(summaryContent: string): string {
  return `Approved interaction summary:\n\n${summaryContent}`;
}
