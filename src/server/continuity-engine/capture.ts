/**
 * CAPTURE step coordinator: raw notes (typed or transcribed) → Claude call
 * → draft InteractionSummary + ActionItem[], both PENDING_APPROVAL, plus
 * an AIInvocationLog entry for full auditability.
 *
 * Structural boundary: this file exports only createCaptureDraft — a
 * create*Draft function. It has no path to APPROVED status; that move
 * only happens in server/actions/interactions.ts's approveCaptureAction,
 * behind requireRole(). This makes it structurally impossible for the AI
 * to finalize anything on its own.
 */
import { db } from "@/lib/db";
import { generateCaptureDraft } from "@/server/continuity-engine/llm/client";
import { getContextEntries } from "@/server/data/contextEntries";
import type { SessionScope } from "@/server/data/scope";

export async function createCaptureDraft(scope: SessionScope, interactionId: string) {
  const interaction = await db.interaction.findUniqueOrThrow({
    where: { id: interactionId },
    include: { member: { include: { user: true } } },
  });
  if (!interaction.rawNotes) {
    throw new Error("Cannot generate a draft before raw notes exist");
  }

  const contextEntries = await getContextEntries(scope, interaction.memberId);
  const recentContext = contextEntries
    .slice(0, 5)
    .map((entry) => `[${entry.category}] ${entry.content}`);

  const { draft, model, promptText, responseText } = await generateCaptureDraft({
    memberName: interaction.member.user.name,
    rawNotes: interaction.rawNotes,
    recentContext,
  });

  await db.$transaction([
    db.interactionSummary.upsert({
      where: { interactionId },
      update: { content: draft.summary, status: "PENDING_APPROVAL" },
      create: { interactionId, content: draft.summary, status: "PENDING_APPROVAL" },
    }),
    db.actionItem.deleteMany({ where: { interactionId, status: "PENDING_APPROVAL" } }),
    ...draft.actionItems.map((item) =>
      db.actionItem.create({
        data: {
          interactionId,
          memberId: interaction.memberId,
          ownerId: interaction.member.user.id,
          description: item.description,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          status: "PENDING_APPROVAL",
        },
      }),
    ),
    db.aIInvocationLog.create({
      data: {
        interactionId,
        memberId: interaction.memberId,
        purpose: "CAPTURE_SUMMARY",
        model,
        promptText,
        responseText,
      },
    }),
  ]);
}
