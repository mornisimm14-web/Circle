/**
 * The single integration point with the Anthropic SDK for the Continuity
 * Engine — no other code calls the Anthropic SDK directly. If a
 * self-hosted model ever becomes necessary later, it's an isolated change
 * to this one file, not a project-wide refactor (see docs/plan.md "Data
 * Privacy & AI Handling").
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { env } from "@/lib/env";
import {
  CAPTURE_SUMMARY_SYSTEM_PROMPT,
  buildCaptureUserPrompt,
  captureDraftSchema,
  type CaptureDraft,
} from "@/server/continuity-engine/llm/prompts/summarize";
import {
  PREP_DIGEST_SYSTEM_PROMPT,
  buildPrepDigestUserPrompt,
} from "@/server/continuity-engine/llm/prompts/prepDigest";

const CAPTURE_SUMMARY_MODEL = "claude-opus-5";
const PREP_DIGEST_MODEL = "claude-opus-5";

export class LLMNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set — cannot generate a draft summary");
    this.name = "LLMNotConfiguredError";
  }
}

export async function generateCaptureDraft(params: {
  memberName: string;
  rawNotes: string;
  recentContext: string[];
}): Promise<{ draft: CaptureDraft; model: string; promptText: string; responseText: string }> {
  if (!env.ANTHROPIC_API_KEY) throw new LLMNotConfiguredError();

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const userPrompt = buildCaptureUserPrompt(params);

  const response = await client.messages.parse({
    model: CAPTURE_SUMMARY_MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: CAPTURE_SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    output_config: { format: zodOutputFormat(captureDraftSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("Claude returned no parsable output for the Capture draft");
  }

  const textBlock = response.content.find((block) => block.type === "text");

  return {
    draft: response.parsed_output,
    model: response.model,
    promptText: `[system]\n${CAPTURE_SUMMARY_SYSTEM_PROMPT}\n\n[user]\n${userPrompt}`,
    responseText: textBlock?.type === "text" ? textBlock.text : JSON.stringify(response.parsed_output),
  };
}

export async function generatePrepDigest(params: {
  memberName: string;
  recentContext: string[];
  openActionItems: string[];
}): Promise<{ digest: string; model: string; promptText: string; responseText: string }> {
  if (!env.ANTHROPIC_API_KEY) throw new LLMNotConfiguredError();

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const userPrompt = buildPrepDigestUserPrompt(params);

  const response = await client.messages.create({
    model: PREP_DIGEST_MODEL,
    max_tokens: 512,
    thinking: { type: "adaptive" },
    system: PREP_DIGEST_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const digest = textBlock?.type === "text" ? textBlock.text.trim() : "";

  return {
    digest,
    model: response.model,
    promptText: `[system]\n${PREP_DIGEST_SYSTEM_PROMPT}\n\n[user]\n${userPrompt}`,
    responseText: digest,
  };
}
