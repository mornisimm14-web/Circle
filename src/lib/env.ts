/**
 * Validates required environment variables at startup so a missing var
 * fails fast with a clear message instead of a confusing runtime error
 * deep inside Prisma or Auth.js.
 */
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().min(1, "NEXTAUTH_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Local speech-to-text service for Capture's audio-upload path. Optional —
  // manual-typing Capture works without it; only "Transcribe locally" needs it.
  WHISPER_SERVICE_URL: z.string().default("http://localhost:9000"),
  // Config-driven audio storage backend — local filesystem now, Cloudflare
  // R2 in the cloud (Sprint 9), swapped without touching callers. See
  // src/server/storage/audioStorage.ts.
  STORAGE_DRIVER: z.enum(["local", "r2"]).default("local"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Missing or invalid environment variables: ${missing}`);
}

export const env = parsed.data;
