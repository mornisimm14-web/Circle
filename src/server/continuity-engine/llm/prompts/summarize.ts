/**
 * Prompt + output schema for the CAPTURE step's single LLM call: raw notes
 * (typed or transcribed) in, a draft InteractionSummary + suggested
 * ActionItem[] out. Both come back PENDING_APPROVAL — this prompt only
 * ever produces a draft; nothing here writes to the database.
 */
import { z } from "zod";

export const CAPTURE_SUMMARY_SYSTEM_PROMPT = `You are drafting a summary of a Support Partner's check-in with a Member of CIRCLE, a peer support platform. You are not a clinician and this is not clinical documentation — write a plain, factual summary of what was discussed, in a warm but professional tone.

Draft two things from the raw notes:
1. A short summary (2-4 sentences) of the interaction — what was discussed, how the Member seemed, anything notable.
2. Any concrete commitments or follow-ups mentioned (e.g. "call the clinic by Friday") as action items. Only include items with a clear, actionable next step — do not invent items that weren't mentioned. It is fine to return zero action items.

This is always a draft. A human Support Partner will review and edit before anything is finalized — do not present it as final, and do not make clinical judgments or diagnoses.`;

export const captureDraftSchema = z.object({
  summary: z.string().describe("2-4 sentence factual summary of the interaction"),
  actionItems: z
    .array(
      z.object({
        description: z.string().describe("The concrete commitment or follow-up"),
        dueDate: z
          .string()
          .nullable()
          .describe("ISO 8601 date (YYYY-MM-DD) if a deadline was mentioned, else null"),
      }),
    )
    .describe("Concrete commitments mentioned in the notes; empty array if none"),
});

export type CaptureDraft = z.infer<typeof captureDraftSchema>;

export function buildCaptureUserPrompt(params: {
  memberName: string;
  rawNotes: string;
  recentContext: string[];
}): string {
  const contextBlock =
    params.recentContext.length > 0
      ? `Recent context about ${params.memberName}:\n${params.recentContext.map((c) => `- ${c}`).join("\n")}\n\n`
      : "";

  return `${contextBlock}Raw notes from today's interaction with ${params.memberName}:\n\n${params.rawNotes}`;
}
