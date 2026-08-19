-- CreateEnum
CREATE TYPE "FlagType" AS ENUM ('SAFETY_KEYWORD', 'MISSED_FOLLOW_UP', 'BOUNDARY_BREACH', 'LLM_FLAGGED');

-- CreateEnum
CREATE TYPE "FlagSource" AS ENUM ('RULE_ENGINE', 'LLM');

-- CreateEnum
CREATE TYPE "FlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReviewQueueStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');

-- AlterEnum
ALTER TYPE "AIInvocationPurpose" ADD VALUE 'SURFACE_ANALYSIS';

-- CreateTable
CREATE TABLE "org_safety_keywords" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "severity" "FlagSeverity" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_safety_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_queue_items" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "interaction_id" TEXT,
    "action_item_id" TEXT,
    "flag_type" "FlagType" NOT NULL,
    "flag_source" "FlagSource" NOT NULL,
    "severity" "FlagSeverity" NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "ReviewQueueStatus" NOT NULL DEFAULT 'OPEN',
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "org_safety_keywords_org_id_idx" ON "org_safety_keywords"("org_id");

-- CreateIndex
CREATE INDEX "review_queue_items_member_id_idx" ON "review_queue_items"("member_id");

-- CreateIndex
CREATE INDEX "review_queue_items_status_idx" ON "review_queue_items"("status");

-- AddForeignKey
ALTER TABLE "org_safety_keywords" ADD CONSTRAINT "org_safety_keywords_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_action_item_id_fkey" FOREIGN KEY ("action_item_id") REFERENCES "action_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
