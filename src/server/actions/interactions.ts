"use server";

/**
 * Server actions behind Prepare + Capture. submitCapture-family actions
 * (startCaptureAction, submitRawNotesAction, uploadAudioAction,
 * generateDraftAction, saveDraftAction) only ever produce or edit a
 * PENDING_APPROVAL draft. approveCaptureAction is the one and only action
 * that can move a capture to APPROVED — it is the sole caller that writes
 * a ContextLedgerEntry from this workflow. This split mirrors the
 * structural boundary in continuity-engine/capture.ts.
 */
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createCaptureDraft } from "@/server/continuity-engine/capture";
import { runSurfaceAnalysis } from "@/server/continuity-engine/surface";
import { transcribeAudio } from "@/server/continuity-engine/transcription/client";
import { saveAudioFile } from "@/server/storage/audioStorage";
import { getSessionScope, requireRole } from "@/server/data/scope";

const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // ~1 hour at standard mp3 bitrate
const ALLOWED_AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "wav"]);

/**
 * Every mutation on this page redirects back to the same base URL, which
 * a browser prefetch (or an earlier visit) can already hold a stale RSC
 * payload for — the client then serves that cached snapshot instead of
 * the fresh one the just-completed action produced, exactly the
 * stale-cache class of bug fixed for post-login in Sprint 1. A per-redirect
 * cache-busting param sidesteps it without a dedicated resolver route per
 * action (there are six here).
 */
function freshCapturePath(interactionId: string) {
  return `/partner/capture/${interactionId}?_r=${Date.now()}`;
}

async function requireOwnedInteraction(scope: Awaited<ReturnType<typeof getSessionScope>>, interactionId: string) {
  const partnerScope = requireRole(scope, "SUPPORT_PARTNER");
  const interaction = await db.interaction.findFirst({
    where: { id: interactionId, supportPartnerId: partnerScope.partnerProfileId ?? "" },
  });
  if (!interaction) redirect("/partner/dashboard?error=Interaction+not+found");
  return interaction;
}

export async function startCaptureAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "SUPPORT_PARTNER");
  const memberId = formData.get("memberId") as string;

  const membership = await db.careCircleMembership.findFirst({
    where: { supportPartnerId: scope.partnerProfileId ?? "", status: "ACTIVE", careCircle: { memberId } },
  });
  if (!membership) redirect(`/partner/prep/${memberId}?error=Not+assigned+to+this+Member`);

  const interaction = await db.interaction.create({
    data: { memberId, supportPartnerId: scope.partnerProfileId ?? "" },
  });

  redirect(`/partner/capture/${interaction.id}`);
}

export async function submitRawNotesAction(formData: FormData) {
  const scope = await getSessionScope();
  const interactionId = formData.get("interactionId") as string;
  await requireOwnedInteraction(scope, interactionId);

  const rawNotes = (formData.get("rawNotes") as string)?.trim();
  if (!rawNotes) redirect(`/partner/capture/${interactionId}?error=Notes+are+required`);

  await db.interaction.update({
    where: { id: interactionId },
    data: { rawNotes, captureMethod: "TYPED" },
  });

  redirect(freshCapturePath(interactionId));
}

export async function uploadAudioAction(formData: FormData) {
  const scope = await getSessionScope();
  const interactionId = formData.get("interactionId") as string;
  await requireOwnedInteraction(scope, interactionId);

  const consentConfirmed = formData.get("consentConfirmed") === "on";
  if (!consentConfirmed) {
    redirect(`/partner/capture/${interactionId}?error=Consent+to+record+is+required+before+upload`);
  }

  const file = formData.get("audioFile") as File | null;
  if (!file || file.size === 0) {
    redirect(`/partner/capture/${interactionId}?error=Choose+an+audio+file+to+upload`);
  }
  if (file.size > MAX_AUDIO_BYTES) {
    redirect(`/partner/capture/${interactionId}?error=Audio+file+is+too+large+(50MB+max)`);
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
    redirect(`/partner/capture/${interactionId}?error=Only+mp3,+m4a,+or+wav+files+are+allowed`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const audioFilePath = await saveAudioFile(buffer, extension);

  let transcript: string;
  try {
    transcript = await transcribeAudio(buffer, file.name);
  } catch {
    redirect(
      `/partner/capture/${interactionId}?error=Transcription+failed+%E2%80%94+is+the+local+Whisper+service+running%3F`,
    );
  }

  await db.interaction.update({
    where: { id: interactionId },
    data: {
      captureMethod: "AUDIO_UPLOAD",
      recordingConsentConfirmed: true,
      audioFilePath,
      rawNotes: transcript,
    },
  });

  redirect(freshCapturePath(interactionId));
}

export async function generateDraftAction(formData: FormData) {
  const scope = await getSessionScope();
  const interactionId = formData.get("interactionId") as string;
  await requireOwnedInteraction(scope, interactionId);

  try {
    await createCaptureDraft(scope!, interactionId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft generation failed";
    redirect(`/partner/capture/${interactionId}?error=${encodeURIComponent(message)}`);
  }

  redirect(freshCapturePath(interactionId));
}

export async function saveDraftAction(formData: FormData) {
  const scope = await getSessionScope();
  const interactionId = formData.get("interactionId") as string;
  await requireOwnedInteraction(scope, interactionId);

  const summaryContent = (formData.get("summary") as string)?.trim();
  if (!summaryContent) redirect(`/partner/capture/${interactionId}?error=Summary+is+required`);

  await db.interactionSummary.update({
    where: { interactionId },
    data: { content: summaryContent },
  });

  redirect(freshCapturePath(interactionId));
}

export async function removeActionItemAction(formData: FormData) {
  const scope = await getSessionScope();
  const interactionId = formData.get("interactionId") as string;
  await requireOwnedInteraction(scope, interactionId);

  const actionItemId = formData.get("actionItemId") as string;
  await db.actionItem.deleteMany({ where: { id: actionItemId, interactionId } });

  redirect(freshCapturePath(interactionId));
}

export async function addActionItemAction(formData: FormData) {
  const scope = await getSessionScope();
  const interactionId = formData.get("interactionId") as string;
  const interaction = await requireOwnedInteraction(scope, interactionId);

  const description = (formData.get("description") as string)?.trim();
  if (!description) redirect(`/partner/capture/${interactionId}?error=Action+item+text+is+required`);
  const dueDateRaw = formData.get("dueDate") as string;

  await db.actionItem.create({
    data: {
      interactionId,
      memberId: interaction.memberId,
      ownerId: (await db.memberProfile.findUniqueOrThrow({ where: { id: interaction.memberId } })).userId,
      description,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      status: "PENDING_APPROVAL",
    },
  });

  redirect(freshCapturePath(interactionId));
}

/**
 * The sole approving action. Moves the InteractionSummary and every
 * PENDING_APPROVAL ActionItem to APPROVED, and writes a ContextLedgerEntry
 * so the summary joins the Member's permanent record. Nothing before this
 * click is final — see the structural boundary note at the top of this file.
 */
export async function approveCaptureAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "SUPPORT_PARTNER");
  const interactionId = formData.get("interactionId") as string;
  const interaction = await requireOwnedInteraction(scope, interactionId);

  const summary = await db.interactionSummary.findUnique({ where: { interactionId } });
  if (!summary) redirect(`/partner/capture/${interactionId}?error=Generate+a+draft+before+approving`);

  await db.$transaction([
    db.interactionSummary.update({ where: { interactionId }, data: { status: "APPROVED" } }),
    db.actionItem.updateMany({
      where: { interactionId, status: "PENDING_APPROVAL" },
      data: { status: "APPROVED" },
    }),
    db.contextLedgerEntry.create({
      data: {
        memberId: interaction.memberId,
        category: "NOTE",
        content: summary!.content,
        visibility: "CIRCLE",
        createdById: scope.userId,
      },
    }),
  ]);

  // Runs after the approve transaction commits, per docs/plan.md's
  // Continuity Engine description ("runs synchronously right after a
  // Capture is approved"). Not part of the transaction above — Surface
  // only ever creates ReviewQueueItems, so a partial failure here can't
  // corrupt the approve itself.
  await runSurfaceAnalysis(interactionId);

  redirect(`/partner/dashboard`);
}
