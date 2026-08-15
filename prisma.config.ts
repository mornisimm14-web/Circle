/**
 * Prisma 7 config (separate from schema.prisma as of this version). Loads
 * .env.local explicitly — Prisma's CLI does not auto-load env files the
 * way Next.js does, and our secrets live in .env.local, not .env.
 */
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
