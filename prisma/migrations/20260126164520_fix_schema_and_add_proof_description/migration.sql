-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_PROGRESS_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_FEEDBACK';
ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_PROOF_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_PROOF_REVIEWED';

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "trainingId" TEXT;

-- AlterTable
ALTER TABLE "ProofOfCompletion" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "assessmentOwnerId" TEXT;

-- CreateTable
CREATE TABLE "SkillResource" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "estimatedHours" INTEGER,
    "provider" TEXT,
    "rating" DOUBLE PRECISION,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAssignment" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "AssessmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillResource_skillId_idx" ON "SkillResource"("skillId");

-- CreateIndex
CREATE INDEX "SkillResource_level_idx" ON "SkillResource"("level");

-- CreateIndex
CREATE INDEX "SkillResource_resourceType_idx" ON "SkillResource"("resourceType");

-- CreateIndex
CREATE INDEX "AssessmentAssignment_userId_idx" ON "AssessmentAssignment"("userId");

-- CreateIndex
CREATE INDEX "AssessmentAssignment_assessmentId_idx" ON "AssessmentAssignment"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAssignment_assessmentId_userId_key" ON "AssessmentAssignment"("assessmentId", "userId");

-- CreateIndex
CREATE INDEX "Assessment_trainingId_idx" ON "Assessment"("trainingId");

-- CreateIndex
CREATE INDEX "Training_assessmentOwnerId_idx" ON "Training"("assessmentOwnerId");

-- AddForeignKey
ALTER TABLE "SkillResource" ADD CONSTRAINT "SkillResource_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_assessmentOwnerId_fkey" FOREIGN KEY ("assessmentOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
