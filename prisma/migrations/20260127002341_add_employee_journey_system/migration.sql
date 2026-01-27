-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('NEW_EMPLOYEE', 'EXISTING_EMPLOYEE');

-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED');

-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('INDUCTION_INITIAL_ASSESSMENT', 'INDUCTION_TRAINING', 'SKILL_ASSESSMENT', 'TNA_GENERATION', 'PROGRESS_TRACKING', 'FEEDBACK_COLLECTION', 'POST_ASSESSMENT', 'ROLE_ASSESSMENT', 'TRAINING_ASSIGNMENT', 'TRAINING_EXECUTION', 'RE_ASSESSMENT', 'MATRIX_UPDATE');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_PROOF_REJECTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentPhaseId" TEXT,
ADD COLUMN     "employeeType" "EmployeeType",
ADD COLUMN     "inductionStartDate" TIMESTAMP(3),
ADD COLUMN     "journeyStatus" "JourneyStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- CreateTable
CREATE TABLE "EmployeeJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeType" "EmployeeType" NOT NULL,
    "status" "JourneyStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cycleNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyPhase" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "phaseType" "PhaseType" NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL DEFAULT 3,
    "status" "PhaseStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "mentorId" TEXT,
    "assessmentId" TEXT,
    "trainingAssignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyActivity" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "phaseNumber" INTEGER,
    "activityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "JourneyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeJourney_userId_key" ON "EmployeeJourney"("userId");

-- CreateIndex
CREATE INDEX "EmployeeJourney_userId_status_idx" ON "EmployeeJourney"("userId", "status");

-- CreateIndex
CREATE INDEX "JourneyPhase_journeyId_status_idx" ON "JourneyPhase"("journeyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyPhase_journeyId_phaseNumber_key" ON "JourneyPhase"("journeyId", "phaseNumber");

-- CreateIndex
CREATE INDEX "JourneyActivity_journeyId_createdAt_idx" ON "JourneyActivity"("journeyId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentPhaseId_fkey" FOREIGN KEY ("currentPhaseId") REFERENCES "JourneyPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeJourney" ADD CONSTRAINT "EmployeeJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyPhase" ADD CONSTRAINT "JourneyPhase_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "EmployeeJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyPhase" ADD CONSTRAINT "JourneyPhase_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyActivity" ADD CONSTRAINT "JourneyActivity_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "EmployeeJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyActivity" ADD CONSTRAINT "JourneyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
