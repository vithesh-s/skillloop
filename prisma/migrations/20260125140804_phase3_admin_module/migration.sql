/*
  Warnings:

  - You are about to drop the column `isMandatory` on the `RoleCompetency` table. All the data in the column will be lost.
  - You are about to drop the column `jobRole` on the `RoleCompetency` table. All the data in the column will be lost.
  - You are about to drop the column `skillName` on the `Skill` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roleId,skillId]` on the table `RoleCompetency` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Skill` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roleId` to the `RoleCompetency` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `requiredLevel` on the `RoleCompetency` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `Skill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proficiencyLevels` to the `Skill` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoleLevel" AS ENUM ('ENTRY', 'MID', 'SENIOR', 'LEAD');

-- CreateEnum
CREATE TYPE "CompetencyPriority" AS ENUM ('REQUIRED', 'PREFERRED', 'OPTIONAL');

-- DropIndex
DROP INDEX "RoleCompetency_jobRole_skillId_key";

-- AlterTable
ALTER TABLE "RoleCompetency" DROP COLUMN "isMandatory",
DROP COLUMN "jobRole",
ADD COLUMN     "priority" "CompetencyPriority" NOT NULL DEFAULT 'REQUIRED',
ADD COLUMN     "roleId" TEXT NOT NULL,
DROP COLUMN "requiredLevel",
ADD COLUMN     "requiredLevel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "skillName",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "proficiencyLevels" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "value" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "password" TEXT,
ADD COLUMN     "roleId" TEXT,
ALTER COLUMN "employeeNo" DROP NOT NULL,
ALTER COLUMN "designation" DROP NOT NULL,
ALTER COLUMN "department" DROP NOT NULL,
ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "level" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OTP" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" CHAR(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "level" "RoleLevel" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OTP_email_idx" ON "OTP"("email");

-- CreateIndex
CREATE INDEX "OTP_expiresAt_idx" ON "OTP"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "OTP_email_code_key" ON "OTP"("email", "code");

-- CreateIndex
CREATE UNIQUE INDEX "JobRole_name_key" ON "JobRole"("name");

-- CreateIndex
CREATE INDEX "JobRole_department_idx" ON "JobRole"("department");

-- CreateIndex
CREATE INDEX "JobRole_level_idx" ON "JobRole"("level");

-- CreateIndex
CREATE INDEX "JobRole_name_idx" ON "JobRole"("name");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");

-- CreateIndex
CREATE INDEX "Assessment_createdById_idx" ON "Assessment"("createdById");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_status_idx" ON "AssessmentAttempt"("status");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_completedAt_idx" ON "AssessmentAttempt"("completedAt");

-- CreateIndex
CREATE INDEX "Notification_readStatus_idx" ON "Notification"("readStatus");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Question_difficultyLevel_idx" ON "Question"("difficultyLevel");

-- CreateIndex
CREATE INDEX "RoleCompetency_roleId_idx" ON "RoleCompetency"("roleId");

-- CreateIndex
CREATE INDEX "RoleCompetency_skillId_idx" ON "RoleCompetency"("skillId");

-- CreateIndex
CREATE INDEX "RoleCompetency_priority_idx" ON "RoleCompetency"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "RoleCompetency_roleId_skillId_key" ON "RoleCompetency"("roleId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_name_idx" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "SkillMatrix_skillId_idx" ON "SkillMatrix"("skillId");

-- CreateIndex
CREATE INDEX "SkillMatrix_status_idx" ON "SkillMatrix"("status");

-- CreateIndex
CREATE INDEX "SystemConfig_key_idx" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "Training_skillId_idx" ON "Training"("skillId");

-- CreateIndex
CREATE INDEX "Training_mode_idx" ON "Training"("mode");

-- CreateIndex
CREATE INDEX "Training_createdById_idx" ON "Training"("createdById");

-- CreateIndex
CREATE INDEX "TrainingAssignment_trainingId_idx" ON "TrainingAssignment"("trainingId");

-- CreateIndex
CREATE INDEX "TrainingAssignment_status_idx" ON "TrainingAssignment"("status");

-- CreateIndex
CREATE INDEX "TrainingAssignment_targetCompletionDate_idx" ON "TrainingAssignment"("targetCompletionDate");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_department_idx" ON "User"("department");

-- CreateIndex
CREATE INDEX "User_managerId_idx" ON "User"("managerId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleCompetency" ADD CONSTRAINT "RoleCompetency_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "JobRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
