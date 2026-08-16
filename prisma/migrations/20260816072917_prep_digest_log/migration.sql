/*
  Warnings:

  - Added the required column `member_id` to the `ai_invocation_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AIInvocationPurpose" ADD VALUE 'PREP_DIGEST';

-- DropForeignKey
ALTER TABLE "ai_invocation_logs" DROP CONSTRAINT "ai_invocation_logs_interaction_id_fkey";

-- AlterTable
ALTER TABLE "ai_invocation_logs" ADD COLUMN     "member_id" TEXT NOT NULL,
ALTER COLUMN "interaction_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ai_invocation_logs_member_id_idx" ON "ai_invocation_logs"("member_id");

-- AddForeignKey
ALTER TABLE "ai_invocation_logs" ADD CONSTRAINT "ai_invocation_logs_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_invocation_logs" ADD CONSTRAINT "ai_invocation_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
