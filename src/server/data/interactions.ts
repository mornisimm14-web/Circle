/**
 * Reads for the Partner's Prepare + Capture workflow. getPrepDigest is the
 * one read in this file that calls the LLM — its output is transient
 * (never written as a ContextLedgerEntry) and degrades gracefully if
 * ANTHROPIC_API_KEY isn't configured, same pattern as the public chat
 * widget's fallback.
 */
import { db } from "@/lib/db";
import { generatePrepDigest, LLMNotConfiguredError } from "@/server/continuity-engine/llm/client";
import { getContextEntries } from "@/server/data/contextEntries";
import type { SessionScope } from "@/server/data/scope";

async function requireActivePartnerForMember(scope: SessionScope, memberId: string) {
  if (scope.role !== "SUPPORT_PARTNER" || !scope.partnerProfileId) return false;
  const membership = await db.careCircleMembership.findFirst({
    where: {
      supportPartnerId: scope.partnerProfileId,
      status: "ACTIVE",
      careCircle: { memberId },
    },
  });
  return Boolean(membership);
}

export async function getPrepDigest(scope: SessionScope, memberId: string) {
  const isAssigned = await requireActivePartnerForMember(scope, memberId);
  if (!isAssigned) return null;

  const member = await db.memberProfile.findUniqueOrThrow({
    where: { id: memberId },
    include: { user: true },
  });

  const [contextEntries, openActionItems] = await Promise.all([
    getContextEntries(scope, memberId),
    db.actionItem.findMany({
      where: { memberId, status: "APPROVED" },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const recentContext = contextEntries.slice(0, 5).map((entry) => `[${entry.category}] ${entry.content}`);
  const openActionItemLines = openActionItems.map(
    (item) => `${item.description}${item.dueDate ? ` — due ${item.dueDate.toISOString().slice(0, 10)}` : ""}`,
  );
  const activeGoals = contextEntries.filter((entry) => entry.category === "GOAL").map((entry) => entry.content);

  let digest: string | null = null;
  try {
    const result = await generatePrepDigest({
      memberName: member.user.name,
      recentContext,
      openActionItems: openActionItemLines,
    });
    digest = result.digest;
    await db.aIInvocationLog.create({
      data: {
        memberId,
        purpose: "PREP_DIGEST",
        model: result.model,
        promptText: result.promptText,
        responseText: result.responseText,
      },
    });
  } catch (error) {
    if (!(error instanceof LLMNotConfiguredError)) throw error;
    // No API key configured — the Prep Card still works, just without the digest line.
  }

  return {
    memberName: member.user.name,
    digest,
    activeGoals,
    openActionItems,
    recentContext: contextEntries.slice(0, 5),
  };
}

export async function getInteraction(scope: SessionScope, interactionId: string) {
  if (scope.role !== "SUPPORT_PARTNER" || !scope.partnerProfileId) return null;

  return db.interaction.findFirst({
    where: { id: interactionId, supportPartnerId: scope.partnerProfileId },
    include: {
      member: { include: { user: true } },
      summary: true,
      actionItems: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getOpenActionItemsForMember(scope: SessionScope, memberId: string) {
  if (scope.role !== "MEMBER" || scope.memberProfileId !== memberId) return [];
  return db.actionItem.findMany({
    where: { memberId, status: "APPROVED" },
    orderBy: { dueDate: "asc" },
  });
}
