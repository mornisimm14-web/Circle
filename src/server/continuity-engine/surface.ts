/**
 * SURFACE step: runs synchronously right after a Capture is approved.
 * Deterministic rules run first (cheap, no network call, always run),
 * then an LLM pass for nuance (skipped gracefully if ANTHROPIC_API_KEY
 * isn't configured — same degrade-gracefully pattern as the rest of the
 * Continuity Engine). Every hit becomes an OPEN ReviewQueueItem; nothing
 * here ever resolves or dismisses one — that's Sprint 6, behind a Lead's
 * own action.
 */
import { db } from "@/lib/db";
import { checkSafetyKeywords } from "@/server/continuity-engine/rules/safetyKeywords";
import { checkMissedFollowThrough } from "@/server/continuity-engine/rules/missedFollowThrough";
import { checkBoundaryBreach } from "@/server/continuity-engine/rules/boundaryBreach";
import { generateSurfaceAnalysis, LLMNotConfiguredError } from "@/server/continuity-engine/llm/client";

export async function runSurfaceAnalysis(interactionId: string) {
  const interaction = await db.interaction.findUniqueOrThrow({
    where: { id: interactionId },
    include: { summary: true, member: true },
  });
  const summaryText = interaction.summary?.content ?? "";
  const orgId = (await db.cohort.findFirst({ where: { memberProfiles: { some: { id: interaction.memberId } } } }))
    ?.orgId;

  // 1. Safety keywords (config-driven, org-scoped).
  if (orgId) {
    const keywordMatches = await checkSafetyKeywords(orgId, summaryText);
    for (const match of keywordMatches) {
      await db.reviewQueueItem.create({
        data: {
          memberId: interaction.memberId,
          interactionId,
          flagType: "SAFETY_KEYWORD",
          flagSource: "RULE_ENGINE",
          severity: match.severity,
          rationale: `Matched configured safety keyword: "${match.keyword}"`,
        },
      });
    }
  }

  // 2. Boundary breach (off-platform contact attempts). One consolidated
  // flag per interaction even if several patterns match the same text —
  // a Lead reviewing the queue wants "this message has two red flags",
  // not two near-identical open items to triage separately.
  const boundaryMatches = checkBoundaryBreach(summaryText);
  if (boundaryMatches.length > 0) {
    await db.reviewQueueItem.create({
      data: {
        memberId: interaction.memberId,
        interactionId,
        flagType: "BOUNDARY_BREACH",
        flagSource: "RULE_ENGINE",
        severity: "HIGH",
        rationale: boundaryMatches.map((m) => m.rationale).join(" "),
      },
    });
  }

  // 3. Missed follow-through — sweeps the Member's whole open-item list,
  // not just this interaction's, so overdue commitments from any prior
  // capture also surface.
  const missedItems = await checkMissedFollowThrough(interaction.memberId);
  for (const item of missedItems) {
    await db.reviewQueueItem.create({
      data: {
        memberId: interaction.memberId,
        interactionId,
        actionItemId: item.actionItemId,
        flagType: "MISSED_FOLLOW_UP",
        flagSource: "RULE_ENGINE",
        severity: "MEDIUM",
        rationale: `"${item.description}" was due ${item.dueDate.toISOString().slice(0, 10)} and is not yet marked done.`,
      },
    });
  }

  // 4. LLM nuance pass — skipped silently if no API key configured.
  if (summaryText) {
    try {
      const { result, model, promptText, responseText } = await generateSurfaceAnalysis(summaryText);
      for (const flag of result.flags) {
        await db.reviewQueueItem.create({
          data: {
            memberId: interaction.memberId,
            interactionId,
            flagType: "LLM_FLAGGED",
            flagSource: "LLM",
            severity: flag.severity,
            rationale: flag.rationale,
          },
        });
      }
      await db.aIInvocationLog.create({
        data: {
          interactionId,
          memberId: interaction.memberId,
          purpose: "SURFACE_ANALYSIS",
          model,
          promptText,
          responseText,
        },
      });
    } catch (error) {
      if (!(error instanceof LLMNotConfiguredError)) throw error;
      // No API key — rule-based flags above still stand; the LLM pass is additive, not required.
    }
  }
}
