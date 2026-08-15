-- CreateEnum
CREATE TYPE "ContextCategory" AS ENUM ('GOAL', 'PREFERENCE', 'NOTE');

-- CreateEnum
CREATE TYPE "ContextVisibility" AS ENUM ('MEMBER_ONLY', 'CIRCLE', 'COHORT', 'ORG');

-- AlterTable
ALTER TABLE "member_profiles" ADD COLUMN     "sharing_prefs" JSONB;

-- CreateTable
CREATE TABLE "context_ledger_entries" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "category" "ContextCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" "ContextVisibility" NOT NULL DEFAULT 'CIRCLE',
    "created_by_id" TEXT NOT NULL,
    "supersedes_id" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "context_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "context_ledger_entries_supersedes_id_key" ON "context_ledger_entries"("supersedes_id");

-- CreateIndex
CREATE INDEX "context_ledger_entries_member_id_is_current_idx" ON "context_ledger_entries"("member_id", "is_current");

-- AddForeignKey
ALTER TABLE "context_ledger_entries" ADD CONSTRAINT "context_ledger_entries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "context_ledger_entries" ADD CONSTRAINT "context_ledger_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "context_ledger_entries" ADD CONSTRAINT "context_ledger_entries_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "context_ledger_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
