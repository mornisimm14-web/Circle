/**
 * Prompt for the Prep Card's "AI Digest" — a short, transient narrative
 * summary shown to a Support Partner before a call. Never persisted as a
 * ContextLedgerEntry; regenerated fresh every time the Prep Card loads.
 */
export const PREP_DIGEST_SYSTEM_PROMPT = `You write a 1-2 sentence "at a glance" digest for a Support Partner about to check in with a Member of CIRCLE, a peer support platform. You are not a clinician — write a plain, warm, factual note based only on the context given. Do not invent details, make clinical judgments, or diagnose. If there's little context, say so briefly rather than padding. Output only the digest text, no preamble.`;

export function buildPrepDigestUserPrompt(params: {
  memberName: string;
  recentContext: string[];
  openActionItems: string[];
}): string {
  const contextBlock =
    params.recentContext.length > 0
      ? params.recentContext.map((c) => `- ${c}`).join("\n")
      : "(no recent context on file)";
  const itemsBlock =
    params.openActionItems.length > 0
      ? params.openActionItems.map((i) => `- ${i}`).join("\n")
      : "(none)";

  return `Member: ${params.memberName}\n\nRecent context:\n${contextBlock}\n\nOpen commitments:\n${itemsBlock}`;
}
