/**
 * Prisma client singleton. Prisma 7 requires a driver adapter at runtime
 * (no more built-in query engine binary) — PrismaPg wraps a standard `pg`
 * connection pool. Singleton pattern avoids exhausting Postgres
 * connections across Next.js dev's hot-reload cycles.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
