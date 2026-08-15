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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Missing or invalid environment variables: ${missing}`);
}

export const env = parsed.data;
