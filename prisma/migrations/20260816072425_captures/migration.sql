-- CreateEnum
CREATE TYPE "CaptureMethod" AS ENUM ('TYPED', 'AUDIO_UPLOAD');

-- CreateEnum
CREATE TYPE "InteractionSummaryStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "AIInvocationPurpose" AS ENUM ('CAPTURE_SUMMARY');

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "support_partner_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capture_method" "CaptureMethod" NOT NULL DEFAULT 'TYPED',
    "recording_consent_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "audio_file_path" TEXT,
    "raw_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_summaries" (
    "id" TEXT NOT NULL,
    "interaction_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "InteractionSummaryStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interaction_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL,
    "interaction_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_invocation_logs" (
    "id" TEXT NOT NULL,
    "interaction_id" TEXT NOT NULL,
    "purpose" "AIInvocationPurpose" NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_text" TEXT NOT NULL,
    "response_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_invocation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interactions_member_id_idx" ON "interactions"("member_id");

-- CreateIndex
CREATE INDEX "interactions_support_partner_id_idx" ON "interactions"("support_partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "interaction_summaries_interaction_id_key" ON "interaction_summaries"("interaction_id");

-- CreateIndex
CREATE INDEX "action_items_member_id_idx" ON "action_items"("member_id");

-- CreateIndex
CREATE INDEX "ai_invocation_logs_interaction_id_idx" ON "ai_invocation_logs"("interaction_id");

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_support_partner_id_fkey" FOREIGN KEY ("support_partner_id") REFERENCES "support_partner_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_summaries" ADD CONSTRAINT "interaction_summaries_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "interactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "interactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_invocation_logs" ADD CONSTRAINT "ai_invocation_logs_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "interactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
