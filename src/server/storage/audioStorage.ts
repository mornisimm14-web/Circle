/**
 * Single integration point for reading/writing Capture audio recordings —
 * no other code touches disk (or, later, S3/R2) directly. Local filesystem
 * today; moving to the cloud in Sprint 9 swaps only this file's internals
 * for a Cloudflare R2 implementation, gated by STORAGE_DRIVER. Filenames
 * are UUID-based, never the Member's name or a raw timestamp, so the
 * filename itself doesn't leak metadata.
 */
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { env } from "@/lib/env";

const AUDIO_ROOT = path.join(process.cwd(), "storage", "audio");

const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
};

export async function saveAudioFile(buffer: Buffer, extension: string): Promise<string> {
  if (env.STORAGE_DRIVER !== "local") {
    throw new Error(`Storage driver "${env.STORAGE_DRIVER}" is not implemented yet`);
  }
  await mkdir(AUDIO_ROOT, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(AUDIO_ROOT, filename), buffer);
  return filename;
}

export async function getAudioFile(
  relativePath: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (env.STORAGE_DRIVER !== "local") {
    throw new Error(`Storage driver "${env.STORAGE_DRIVER}" is not implemented yet`);
  }
  // relativePath is a filename we generated (UUID.ext) — reject anything
  // that could escape AUDIO_ROOT before it ever reaches the filesystem.
  const resolved = path.resolve(AUDIO_ROOT, relativePath);
  if (!resolved.startsWith(AUDIO_ROOT + path.sep)) {
    throw new Error("Invalid audio file path");
  }
  const extension = path.extname(relativePath).slice(1).toLowerCase();
  const buffer = await readFile(resolved);
  return { buffer, mimeType: MIME_BY_EXTENSION[extension] ?? "application/octet-stream" };
}
