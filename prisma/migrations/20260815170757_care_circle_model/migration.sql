-- CreateEnum
CREATE TYPE "CareCircleRole" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lead_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cohort_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_partner_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cohort_id" TEXT,
    "caseload_cap" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_partner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_lead_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_lead_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_circles" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_circle_memberships" (
    "id" TEXT NOT NULL,
    "care_circle_id" TEXT NOT NULL,
    "support_partner_id" TEXT NOT NULL,
    "role_in_circle" "CareCircleRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_circle_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_lead_id_key" ON "cohorts"("lead_id");

-- CreateIndex
CREATE INDEX "cohorts_org_id_idx" ON "cohorts"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_user_id_key" ON "member_profiles"("user_id");

-- CreateIndex
CREATE INDEX "member_profiles_cohort_id_idx" ON "member_profiles"("cohort_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_partner_profiles_user_id_key" ON "support_partner_profiles"("user_id");

-- CreateIndex
CREATE INDEX "support_partner_profiles_cohort_id_idx" ON "support_partner_profiles"("cohort_id");

-- CreateIndex
CREATE UNIQUE INDEX "professional_lead_profiles_user_id_key" ON "professional_lead_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "care_circles_member_id_key" ON "care_circles"("member_id");

-- CreateIndex
CREATE INDEX "care_circle_memberships_care_circle_id_idx" ON "care_circle_memberships"("care_circle_id");

-- CreateIndex
CREATE INDEX "care_circle_memberships_support_partner_id_idx" ON "care_circle_memberships"("support_partner_id");

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "professional_lead_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_partner_profiles" ADD CONSTRAINT "support_partner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_partner_profiles" ADD CONSTRAINT "support_partner_profiles_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_lead_profiles" ADD CONSTRAINT "professional_lead_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_circles" ADD CONSTRAINT "care_circles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_circle_memberships" ADD CONSTRAINT "care_circle_memberships_care_circle_id_fkey" FOREIGN KEY ("care_circle_id") REFERENCES "care_circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_circle_memberships" ADD CONSTRAINT "care_circle_memberships_support_partner_id_fkey" FOREIGN KEY ("support_partner_id") REFERENCES "support_partner_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Structural invariant: at most one ACTIVE PRIMARY membership per care
-- circle. Prisma's schema DSL has no WHERE-clause index syntax, so this
-- partial unique index is hand-written rather than generated. Application
-- code (src/server/actions/care-circle.ts) enforces the same rule before
-- writing, so this exists as a backstop against races/bugs, not as the
-- primary mechanism.
CREATE UNIQUE INDEX "care_circle_memberships_one_active_primary"
  ON "care_circle_memberships" ("care_circle_id")
  WHERE "role_in_circle" = 'PRIMARY' AND "status" = 'ACTIVE';
