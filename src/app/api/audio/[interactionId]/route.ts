/**
 * Serves a Capture's uploaded audio recording — never as a public static
 * asset. Goes through the same SessionScope layer as every other piece of
 * data: only the assigned Support Partner can currently listen (a
 * cohort's Lead gains access once Sprint 6 builds the Review Queue).
 */
import { NextResponse } from "next/server";
import { getAudioFile } from "@/server/storage/audioStorage";
import { getInteraction } from "@/server/data/interactions";
import { getSessionScope } from "@/server/data/scope";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ interactionId: string }> },
) {
  const { interactionId } = await params;
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const interaction = await getInteraction(scope, interactionId);
  if (!interaction || !interaction.audioFilePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { buffer, mimeType } = await getAudioFile(interaction.audioFilePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": mimeType, "Content-Disposition": "inline" },
  });
}
