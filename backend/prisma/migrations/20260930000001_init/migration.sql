-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'OPEN', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "activity_activities" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" VARCHAR(5000) NOT NULL,
    "category" VARCHAR(150) NOT NULL,
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "max_participants" INTEGER NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" TEXT NOT NULL,
    "creator_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_roles" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "name_key" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "max_members" INTEGER NOT NULL,

    CONSTRAINT "activity_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_team_applications" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_team_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_registrations" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_evaluations" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "liked" VARCHAR(2000) NOT NULL,
    "improvement" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_activities_created_by_idx" ON "activity_activities"("created_by");

-- CreateIndex
CREATE INDEX "activity_activities_status_start_at_idx" ON "activity_activities"("status", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "activity_roles_activity_id_name_key_key" ON "activity_roles"("activity_id", "name_key");

-- CreateIndex
CREATE UNIQUE INDEX "activity_roles_id_activity_id_key" ON "activity_roles"("id", "activity_id");

-- CreateIndex
CREATE INDEX "activity_team_applications_role_id_activity_id_status_idx" ON "activity_team_applications"("role_id", "activity_id", "status");

-- CreateIndex
CREATE INDEX "activity_team_applications_core_user_id_idx" ON "activity_team_applications"("core_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_team_applications_activity_id_core_user_id_key" ON "activity_team_applications"("activity_id", "core_user_id");

-- CreateIndex
CREATE INDEX "activity_registrations_core_user_id_idx" ON "activity_registrations"("core_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_registrations_activity_id_core_user_id_key" ON "activity_registrations"("activity_id", "core_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_evaluations_activity_id_core_user_id_key" ON "activity_evaluations"("activity_id", "core_user_id");

-- AddForeignKey
ALTER TABLE "activity_roles" ADD CONSTRAINT "activity_roles_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_team_applications" ADD CONSTRAINT "activity_team_applications_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_team_applications" ADD CONSTRAINT "activity_team_applications_role_id_activity_id_fkey" FOREIGN KEY ("role_id", "activity_id") REFERENCES "activity_roles"("id", "activity_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_registrations" ADD CONSTRAINT "activity_registrations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_evaluations" ADD CONSTRAINT "activity_evaluations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business invariants that schema.prisma cannot express. They guard the data even
-- if a bug (or a hand-run SQL statement) bypasses the service layer.
ALTER TABLE "activity_activities" ADD CONSTRAINT "activity_capacity_positive" CHECK ("max_participants" > 0);
ALTER TABLE "activity_activities" ADD CONSTRAINT "activity_dates_ordered" CHECK ("end_at" > "start_at");
ALTER TABLE "activity_roles" ADD CONSTRAINT "activity_role_capacity_valid" CHECK ("max_members" BETWEEN 1 AND 999);
ALTER TABLE "activity_evaluations" ADD CONSTRAINT "activity_rating_valid" CHECK ("rating" BETWEEN 1 AND 5);
