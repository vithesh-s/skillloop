/**
 * Journey Engine - Auto-update logic for employee development lifecycle
 * 
 * Core functions:
 * - initializeJourney: Create journey with configurable phases
 * - autoAdvancePhase: Auto-advance when assessment/training completes
 * - calculatePhaseProgress: Calculate % completion
 * - checkOverduePhases: Daily cron to mark overdue
 */

import { prisma } from "@/lib/prisma";
import {
  EmployeeType,
  JourneyStatus,
  PhaseStatus,
  PhaseType,
  Prisma,
} from "@prisma/client";
import {
    PhaseConfig,
    JourneyProgress,
    DEFAULT_NEW_EMPLOYEE_PHASES,
    DEFAULT_EXISTING_EMPLOYEE_PHASES,
} from "@/lib/journey-constants";

/**
 * Initialize a new employee journey with configurable phases
 */
export async function initializeJourney(
  userId: string,
  employeeType: EmployeeType,
  customPhases?: PhaseConfig[],
  startDate?: Date
): Promise<string> {
  const phases =
    customPhases ||
    (employeeType === EmployeeType.NEW_EMPLOYEE
      ? DEFAULT_NEW_EMPLOYEE_PHASES
      : DEFAULT_EXISTING_EMPLOYEE_PHASES);

  const journeyStartDate = startDate || new Date();

  // Create journey and phases in a transaction
  const journey = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Create the journey
    const newJourney = await tx.employeeJourney.create({
      data: {
        userId,
        employeeType,
        status: JourneyStatus.IN_PROGRESS,
        startedAt: journeyStartDate,
        cycleNumber: 1,
      },
    });

    // Create phases
    let currentDate = new Date(journeyStartDate);
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const dueDate = new Date(currentDate);
      dueDate.setDate(dueDate.getDate() + phase.durationDays);

      await tx.journeyPhase.create({
        data: {
          journeyId: newJourney.id,
          phaseType: phase.phaseType,
          phaseNumber: i + 1,
          title: phase.title,
          description: phase.description,
          durationDays: phase.durationDays,
          status: i === 0 ? PhaseStatus.IN_PROGRESS : PhaseStatus.NOT_STARTED,
          startedAt: i === 0 ? journeyStartDate : null,
          dueDate,
          mentorId: phase.mentorId,
        },
      });

      currentDate = dueDate;
    }

    // Update user
    const firstPhase = await tx.journeyPhase.findFirst({
      where: { journeyId: newJourney.id, phaseNumber: 1 },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        employeeType,
        journeyStatus: JourneyStatus.IN_PROGRESS,
        currentPhaseId: firstPhase?.id,
        inductionStartDate: journeyStartDate,
      },
    });

    // Log activity
    await tx.journeyActivity.create({
      data: {
        journeyId: newJourney.id,
        activityType: "JOURNEY_STARTED",
        title: "Journey Started",
        description: `${employeeType === EmployeeType.NEW_EMPLOYEE ? "New employee" : "Existing employee"} journey initiated`,
        userId,
      },
    });

    return newJourney;
  });

  return journey.id;
}

/**
 * Auto-advance to the next phase when triggered by events
 */
export async function autoAdvancePhase(
  journeyId: string,
  triggeredBy: string,
  metadata?: Prisma.InputJsonValue
): Promise<boolean> {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const journey = await tx.employeeJourney.findUnique({
      where: { id: journeyId },
      include: {
        phases: {
          orderBy: { phaseNumber: "asc" },
        },
        user: true,
      },
    });

    if (!journey) {
      throw new Error("Journey not found");
    }

    // Find current phase
    const currentPhase = journey.phases.find(
      (p: any) => p.status === PhaseStatus.IN_PROGRESS
    );

    if (!currentPhase) {
      return false;
    }

    // Mark current phase as completed
    await tx.journeyPhase.update({
      where: { id: currentPhase.id },
      data: {
        status: PhaseStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Log activity
    await tx.journeyActivity.create({
      data: {
        journeyId,
        phaseNumber: currentPhase.phaseNumber,
        activityType: "PHASE_AUTO_COMPLETED",
        title: `${currentPhase.title} Completed`,
        description: `Phase auto-completed by ${triggeredBy}`,
        metadata: metadata as Prisma.InputJsonValue,
        userId: journey.userId,
      },
    });

    // Find next phase
    const nextPhase = journey.phases.find(
      (p: any) => p.phaseNumber === currentPhase.phaseNumber + 1
    );

    if (nextPhase) {
      // Start next phase
      await tx.journeyPhase.update({
        where: { id: nextPhase.id },
        data: {
          status: PhaseStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Update user's current phase
      await tx.user.update({
        where: { id: journey.userId },
        data: {
          currentPhaseId: nextPhase.id,
        },
      });

      // Log activity
      await tx.journeyActivity.create({
        data: {
          journeyId,
          phaseNumber: nextPhase.phaseNumber,
          activityType: "PHASE_STARTED",
          title: `${nextPhase.title} Started`,
          description: "Phase automatically started after previous phase completion",
          userId: journey.userId,
        },
      });
    } else {
      // Journey completed
      await tx.employeeJourney.update({
        where: { id: journeyId },
        data: {
          status: JourneyStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: journey.userId },
        data: {
          journeyStatus: JourneyStatus.COMPLETED,
          currentPhaseId: null,
        },
      });

      // Log activity
      await tx.journeyActivity.create({
        data: {
          journeyId,
          activityType: "JOURNEY_COMPLETED",
          title: "Journey Completed",
          description: "All phases completed successfully",
          userId: journey.userId,
        },
      });

      // For existing employees, start a new cycle
      if (journey.employeeType === EmployeeType.EXISTING_EMPLOYEE) {
        // Auto-initialize next cycle
        await initializeJourney(
          journey.userId,
          EmployeeType.EXISTING_EMPLOYEE,
          undefined,
          new Date()
        );
      }
    }

    return true;
  });
}

/**
 * Calculate phase progress for a journey
 */
export async function calculatePhaseProgress(
  journeyId: string
): Promise<JourneyProgress> {
  const journey = await prisma.employeeJourney.findUnique({
    where: { id: journeyId },
    include: {
      phases: {
        orderBy: { phaseNumber: "asc" },
      },
    },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  const totalPhases = journey.phases.length;
  const completedPhases = journey.phases.filter(
    (p: any) => p.status === PhaseStatus.COMPLETED
  ).length;
  const currentPhase = journey.phases.find(
    (p: any) => p.status === PhaseStatus.IN_PROGRESS
  );

  const progressPercentage = Math.round((completedPhases / totalPhases) * 100);

  const result: JourneyProgress = {
    totalPhases,
    completedPhases,
    currentPhase: currentPhase?.phaseNumber || 0,
    progressPercentage,
  };

  // Calculate days elapsed and remaining for new employees
  if (journey.startedAt && journey.employeeType === EmployeeType.NEW_EMPLOYEE) {
    const now = new Date();
    const startDate = new Date(journey.startedAt);
    const daysElapsed = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const lastPhase = journey.phases[journey.phases.length - 1];
    if (lastPhase?.dueDate) {
      const totalDays = Math.floor(
        (new Date(lastPhase.dueDate).getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.max(0, totalDays - daysElapsed);

      result.daysElapsed = daysElapsed;
      result.daysRemaining = daysRemaining;
      result.expectedCompletionDate = lastPhase.dueDate;
    }
  }

  return result;
}

/**
 * Check and mark overdue phases (called by cron)
 */
export async function checkOverduePhases(): Promise<number> {
  const now = new Date();

  const overduePhases = await prisma.journeyPhase.findMany({
    where: {
      status: PhaseStatus.IN_PROGRESS,
      dueDate: {
        lt: now,
      },
    },
    include: {
      journey: {
        include: {
          user: true,
        },
      },
    },
  });

  let count = 0;

  for (const phase of overduePhases) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Mark as overdue
      await tx.journeyPhase.update({
        where: { id: phase.id },
        data: {
          status: PhaseStatus.OVERDUE,
        },
      });

      // Log activity
      await tx.journeyActivity.create({
        data: {
          journeyId: phase.journeyId,
          phaseNumber: phase.phaseNumber,
          activityType: "PHASE_OVERDUE",
          title: `${phase.title} Overdue`,
          description: `Phase became overdue on ${now.toDateString()}`,
          userId: phase.journey.userId,
        },
      });

      // TODO: Send notification to user and mentor
      count++;
    });
  }

  return count;
}

/**
 * Manually complete a phase (for admin override)
 */
export async function manuallyCompletePhase(
  phaseId: string,
  completedBy: string,
  notes?: string
): Promise<boolean> {
  const phase = await prisma.journeyPhase.findUnique({
    where: { id: phaseId },
    include: { journey: true },
  });

  if (!phase) {
    throw new Error("Phase not found");
  }

  await autoAdvancePhase(
    phase.journeyId,
    `manual_completion_by_${completedBy}`,
    { notes } as Prisma.InputJsonValue
  );

  return true;
}

/**
 * Pause a journey
 */
export async function pauseJourney(
  journeyId: string,
  reason?: string
): Promise<boolean> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const journey = await tx.employeeJourney.update({
      where: { id: journeyId },
      data: {
        status: JourneyStatus.PAUSED,
      },
      include: { user: true },
    });

    await tx.user.update({
      where: { id: journey.userId },
      data: {
        journeyStatus: JourneyStatus.PAUSED,
      },
    });

    await tx.journeyActivity.create({
      data: {
        journeyId,
        activityType: "JOURNEY_PAUSED",
        title: "Journey Paused",
        description: reason || "Journey paused by administrator",
        userId: journey.userId,
      },
    });
  });

  return true;
}

/**
 * Resume a paused journey
 */
export async function resumeJourney(journeyId: string): Promise<boolean> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const journey = await tx.employeeJourney.update({
      where: { id: journeyId },
      data: {
        status: JourneyStatus.IN_PROGRESS,
      },
      include: { user: true },
    });

    await tx.user.update({
      where: { id: journey.userId },
      data: {
        journeyStatus: JourneyStatus.IN_PROGRESS,
      },
    });

    await tx.journeyActivity.create({
      data: {
        journeyId,
        activityType: "JOURNEY_RESUMED",
        title: "Journey Resumed",
        description: "Journey resumed by administrator",
        userId: journey.userId,
      },
    });
  });

  return true;
}

/**
 * Link an assessment to a journey phase
 */
export async function linkAssessmentToPhase(
  phaseId: string,
  assessmentId: string
): Promise<boolean> {
  const phase = await prisma.journeyPhase.update({
    where: { id: phaseId },
    data: {
      assessmentId,
    },
    include: { journey: true },
  });

  await prisma.journeyActivity.create({
    data: {
      journeyId: phase.journeyId,
      phaseNumber: phase.phaseNumber,
      activityType: "ASSESSMENT_LINKED",
      title: "Assessment Linked",
      description: `Assessment ${assessmentId} linked to ${phase.title}`,
      userId: phase.journey.userId,
    },
  });

  return true;
}

/**
 * Link a training assignment to a journey phase
 */
export async function linkTrainingToPhase(
  phaseId: string,
  trainingAssignmentId: string
): Promise<boolean> {
  const phase = await prisma.journeyPhase.update({
    where: { id: phaseId },
    data: {
      trainingAssignmentId,
    },
    include: { journey: true },
  });

  await prisma.journeyActivity.create({
    data: {
      journeyId: phase.journeyId,
      phaseNumber: phase.phaseNumber,
      activityType: "TRAINING_LINKED",
      title: "Training Linked",
      description: `Training assignment ${trainingAssignmentId} linked to ${phase.title}`,
      userId: phase.journey.userId,
    },
  });

  return true;
}
