"use server";

/**
 * Journey Management Server Actions
 * Handles CRUD operations for employee journeys
 */

import { db as prisma } from "@/lib/db";
import {
  initializeJourney,
  autoAdvancePhase,
  calculatePhaseProgress,
  pauseJourney,
  resumeJourney,
  linkAssessmentToPhase,
  linkTrainingToPhase,
} from "@/lib/journey-engine";
import {
  PhaseConfig,
  DEFAULT_NEW_EMPLOYEE_PHASES,
  DEFAULT_EXISTING_EMPLOYEE_PHASES,
} from "@/lib/journey-constants";
import {
  EmployeeType,
  JourneyStatus,
  PhaseStatus,
  PhaseType,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

/**
 * Create a new journey for an employee
 */
export async function createJourney(
  userId: string,
  employeeType: EmployeeType,
  customPhases?: PhaseConfig[],
  startDate?: Date
) {
  try {
    // Check if user already has an active journey
    const existingJourney = await prisma.employeeJourney.findFirst({
      where: {
        userId,
        status: {
          in: [JourneyStatus.IN_PROGRESS, JourneyStatus.NOT_STARTED],
        },
      },
    });

    if (existingJourney) {
      return {
        success: false,
        error: "User already has an active journey",
      };
    }

    const journeyId = await initializeJourney(
      userId,
      employeeType,
      customPhases,
      startDate
    );

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}/journey`);

    return {
      success: true,
      journeyId,
      message: "Journey created successfully",
    };
  } catch (error) {
    console.error("Error creating journey:", error);
    return {
      success: false,
      error: "Failed to create journey",
    };
  }
}

/**
 * Add a new phase to an existing journey (only for new employees)
 */
export async function addJourneyPhase(
  journeyId: string,
  phaseConfig: PhaseConfig,
  insertAfterPhaseNumber?: number
) {
  try {
    const journey = await prisma.employeeJourney.findUnique({
      where: { id: journeyId },
      include: { phases: { orderBy: { phaseNumber: "asc" } } },
    });

    if (!journey) {
      return { success: false, error: "Journey not found" };
    }

    if (journey.employeeType !== EmployeeType.NEW_EMPLOYEE) {
      return {
        success: false,
        error: "Can only add custom phases to new employee journeys",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Determine the phase number
      const phaseNumber = insertAfterPhaseNumber
        ? insertAfterPhaseNumber + 1
        : journey.phases.length + 1;

      // Shift subsequent phases if inserting in the middle
      if (insertAfterPhaseNumber) {
        await tx.journeyPhase.updateMany({
          where: {
            journeyId,
            phaseNumber: { gte: phaseNumber },
          },
          data: {
            phaseNumber: {
              increment: 1,
            },
          },
        });
      }

      // Calculate start date based on previous phase
      let startDate = new Date();
      if (insertAfterPhaseNumber) {
        const previousPhase = journey.phases.find(
          (p) => p.phaseNumber === insertAfterPhaseNumber
        );
        if (previousPhase?.dueDate) {
          startDate = new Date(previousPhase.dueDate);
        }
      }

      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + phaseConfig.durationDays);

      // Create the new phase
      await tx.journeyPhase.create({
        data: {
          journeyId,
          phaseType: phaseConfig.phaseType,
          phaseNumber,
          title: phaseConfig.title,
          description: phaseConfig.description,
          durationDays: phaseConfig.durationDays,
          status: PhaseStatus.NOT_STARTED,
          dueDate,
          mentorId: phaseConfig.mentorId,
        },
      });

      // Log activity
      await tx.journeyActivity.create({
        data: {
          journeyId,
          phaseNumber,
          activityType: "PHASE_ADDED",
          title: "Phase Added",
          description: `Custom phase "${phaseConfig.title}" added to journey`,
          userId: journey.userId,
        },
      });
    });

    revalidatePath(`/admin/users/${journey.userId}/journey`);

    return {
      success: true,
      message: "Phase added successfully",
    };
  } catch (error) {
    console.error("Error adding phase:", error);
    return {
      success: false,
      error: "Failed to add phase",
    };
  }
}

/**
 * Skip a phase (mark as completed without actual completion)
 */
export async function skipJourneyPhase(
  journeyId: string,
  phaseNumber: number,
  reason?: string
) {
  try {
    const journey = await prisma.employeeJourney.findUnique({
      where: { id: journeyId },
      include: { phases: { orderBy: { phaseNumber: "asc" } } },
    });

    if (!journey) {
      return { success: false, error: "Journey not found" };
    }

    const phase = journey.phases.find((p) => p.phaseNumber === phaseNumber);
    if (!phase) {
      return { success: false, error: "Phase not found" };
    }

    if (phase.status === PhaseStatus.COMPLETED) {
      return { success: false, error: "Phase already completed" };
    }

    await autoAdvancePhase(journeyId, "phase_skipped", { reason } as Prisma.InputJsonValue);

    revalidatePath(`/admin/users/${journey.userId}/journey`);

    return {
      success: true,
      message: "Phase skipped successfully",
    };
  } catch (error) {
    console.error("Error skipping phase:", error);
    return {
      success: false,
      error: "Failed to skip phase",
    };
  }
}

/**
 * Assign a mentor to a specific phase
 */
export async function assignMentorToPhase(
  phaseId: string,
  mentorId: string,
  sendNotification: boolean = true
) {
  try {
    // Check if the assigned mentor has the MENTOR role, if not, add it
    const mentorUser = await prisma.user.findUnique({
      where: { id: mentorId },
      select: { id: true, systemRoles: true }
    });

    if (mentorUser && !mentorUser.systemRoles.includes("MENTOR")) {
      await prisma.user.update({
        where: { id: mentorId },
        data: {
          systemRoles: {
            push: "MENTOR"
          }
        }
      });
    }

    const phase = await prisma.journeyPhase.update({
      where: { id: phaseId },
      data: { mentorId },
      include: {
        journey: { include: { user: true } },
        mentor: true,
      },
    });

    // Log activity
    await prisma.journeyActivity.create({
      data: {
        journeyId: phase.journeyId,
        phaseNumber: phase.phaseNumber,
        activityType: "MENTOR_ASSIGNED",
        title: "Mentor Assigned",
        description: `${phase.mentor?.name} assigned as mentor for ${phase.title}`,
        userId: phase.journey.userId,
      },
    });

    // Send notification to mentor
    if (sendNotification && phase.mentor && phase.mentor.email) {
      await sendEmail({
        to: phase.mentor.email,
        subject: "New Mentor Assignment - Skill Loop",
        template: "mentor-assigned",
        data: {
          mentorName: phase.mentor.name,
          employeeName: phase.journey.user.name,
          phaseTitle: phase.title,
          startDate: phase.startedAt ? new Date(phase.startedAt).toLocaleDateString() : 'Not started yet',
          duration: phase.durationDays
        }
      });
    }

    revalidatePath(`/admin/users/${phase.journey.userId}/journey`);

    return {
      success: true,
      message: "Mentor assigned successfully",
    };
  } catch (error) {
    console.error("Error assigning mentor:", error);
    return {
      success: false,
      error: "Failed to assign mentor",
    };
  }
}

/**
 * Remove a mentor from a specific phase
 */
export async function removeMentorFromPhase(phaseId: string) {
  try {
    const phase = await prisma.journeyPhase.update({
      where: { id: phaseId },
      data: { mentorId: null },
      include: {
        journey: true,
      },
    });

    // Log activity
    await prisma.journeyActivity.create({
      data: {
        journeyId: phase.journeyId,
        phaseNumber: phase.phaseNumber,
        activityType: "MENTOR_REMOVED",
        title: "Mentor Removed",
        description: `Mentor removed from ${phase.title}`,
        userId: phase.journey.userId,
      },
    });

    revalidatePath(`/admin/users/${phase.journey.userId}/journey`);

    return {
      success: true,
      message: "Mentor removed successfully",
    };
  } catch (error) {
    console.error("Error removing mentor:", error);
    return {
      success: false,
      error: "Failed to remove mentor",
    };
  }
}

/**
 * Get complete journey details for a user
 */
export async function getEmployeeJourney(userId: string) {
  try {
    const journey = await prisma.employeeJourney.findFirst({
      where: { userId },
      include: {
        phases: {
          orderBy: { phaseNumber: "asc" },
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                designation: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            designation: true,
            department: true,
            dateOfJoining: true,
          },
        },
      },
    });

    if (!journey) {
      return {
        success: false,
        error: "Journey not found",
      };
    }

    const progress = await calculatePhaseProgress(journey.id);

    return {
      success: true,
      journey: {
        ...journey,
        progress,
      },
    };
  } catch (error) {
    console.error("Error getting journey:", error);
    return {
      success: false,
      error: "Failed to retrieve journey",
    };
  }
}

/**
 * Get all journeys with filters
 */
export async function getAllJourneys(filters?: {
  employeeType?: EmployeeType;
  status?: JourneyStatus;
  department?: string;
  search?: string;
}) {
  try {
    const where: Prisma.EmployeeJourneyWhereInput = {};

    if (filters?.employeeType) {
      where.employeeType = filters.employeeType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.department) {
      where.user = {
        department: filters.department,
      };
    }

    if (filters?.search) {
      where.user = {
        ...where.user,
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { employeeNo: { contains: filters.search, mode: "insensitive" } },
        ],
      } as any;
    }

    const journeys = await prisma.employeeJourney.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            designation: true,
            department: true,
            employeeNo: true,
          },
        },
        phases: {
          where: {
            status: PhaseStatus.IN_PROGRESS,
          },
          take: 1,
        },
        _count: {
          select: {
            phases: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate progress for each journey
    const journeysWithProgress = await Promise.all(
      journeys.map(async (journey) => {
        const progress = await calculatePhaseProgress(journey.id);
        return {
          ...journey,
          progress,
        };
      })
    );

    return {
      success: true,
      journeys: journeysWithProgress,
    };
  } catch (error) {
    console.error("Error getting journeys:", error);
    return {
      success: false,
      error: "Failed to retrieve journeys",
    };
  }
}

/**
 * Pause a journey
 */
export async function pauseEmployeeJourney(journeyId: string, reason?: string) {
  try {
    await pauseJourney(journeyId, reason);

    const journey = await prisma.employeeJourney.findUnique({
      where: { id: journeyId },
      select: { userId: true },
    });

    if (journey) {
      revalidatePath(`/admin/users/${journey.userId}/journey`);
      revalidatePath("/admin/users");
    }

    return {
      success: true,
      message: "Journey paused successfully",
    };
  } catch (error) {
    console.error("Error pausing journey:", error);
    return {
      success: false,
      error: "Failed to pause journey",
    };
  }
}

/**
 * Resume a paused journey
 */
export async function resumeEmployeeJourney(journeyId: string) {
  try {
    await resumeJourney(journeyId);

    const journey = await prisma.employeeJourney.findUnique({
      where: { id: journeyId },
      select: { userId: true },
    });

    if (journey) {
      revalidatePath(`/admin/users/${journey.userId}/journey`);
      revalidatePath("/admin/users");
    }

    return {
      success: true,
      message: "Journey resumed successfully",
    };
  } catch (error) {
    console.error("Error resuming journey:", error);
    return {
      success: false,
      error: "Failed to resume journey",
    };
  }
}

/**
 * Get journey statistics for dashboard
 */
export async function getJourneyStatistics() {
  try {
    const [
      totalActive,
      totalCompleted,
      overduePhases,
      newEmployeeJourneys,
      existingEmployeeJourneys,
      recentActivities,
    ] = await Promise.all([
      prisma.employeeJourney.count({
        where: { status: JourneyStatus.IN_PROGRESS },
      }),
      prisma.employeeJourney.count({
        where: { status: JourneyStatus.COMPLETED },
      }),
      prisma.journeyPhase.count({
        where: { status: PhaseStatus.OVERDUE },
      }),
      prisma.employeeJourney.count({
        where: {
          employeeType: EmployeeType.NEW_EMPLOYEE,
          status: JourneyStatus.IN_PROGRESS,
        },
      }),
      prisma.employeeJourney.count({
        where: {
          employeeType: EmployeeType.EXISTING_EMPLOYEE,
          status: JourneyStatus.IN_PROGRESS,
        },
      }),
      prisma.journeyActivity.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          journey: {
            include: {
              user: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalActive,
        totalCompleted,
        overduePhases,
        newEmployeeJourneys,
        existingEmployeeJourneys,
        recentActivities,
      },
    };
  } catch (error) {
    console.error("Error getting statistics:", error);
    return {
      success: false,
      error: "Failed to retrieve statistics",
    };
  }
}

/**
 * Get default phase configurations
 */
export async function getDefaultPhaseConfigs(employeeType: EmployeeType) {
  return {
    success: true,
    phases:
      employeeType === EmployeeType.NEW_EMPLOYEE
        ? DEFAULT_NEW_EMPLOYEE_PHASES
        : DEFAULT_EXISTING_EMPLOYEE_PHASES,
  };
}

/**
 * Link assessment to phase (for auto-advancement)
 * Auto-assigns the assessment to the user if not already assigned
 */
export async function linkAssessment(phaseId: string, assessmentId: string) {
  try {
    const session = await auth();

    // Get the journey and user details
    const phase = await prisma.journeyPhase.findUnique({
      where: { id: phaseId },
      include: {
        journey: {
          select: {
            userId: true
          }
        }
      },
    });

    if (!phase) {
      return {
        success: false,
        error: "Phase not found",
      };
    }

    const userId = phase.journey.userId;

    // Check if assessment is already assigned to this user
    const existingAssignment = await prisma.assessmentAssignment.findUnique({
      where: {
        assessmentId_userId: {
          assessmentId,
          userId,
        },
      },
    });

    // If not assigned, create the assignment
    if (!existingAssignment) {
      const sessionUserId = session?.user?.id;

      if (!sessionUserId) {
        return {
          success: false,
          error: "You must be logged in to assign assessments",
        };
      }

      // Verify the assigner exists in the database
      const assigner = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true }
      });

      if (!assigner) {
        return {
          success: false,
          error: "Invalid session user. Please log in again.",
        };
      }

      await prisma.assessmentAssignment.create({
        data: {
          assessmentId,
          userId,
          assignedById: assigner.id,
          status: "PENDING",
        },
      });

      // We might want to notify the user here about the new assignment
    }

    await linkAssessmentToPhase(phaseId, assessmentId);

    const updatedPhase = await prisma.journeyPhase.findUnique({
      where: { id: phaseId },
      include: { journey: true },
    });

    if (updatedPhase) {
      revalidatePath(`/admin/users/${updatedPhase.journey.userId}/journey`);
    }

    return {
      success: true,
      message: "Assessment linked (and assigned) successfully",
    };
  } catch (error) {
    console.error("Error linking assessment:", error);
    return {
      success: false,
      error: "Failed to link assessment",
    };
  }
}

/**
 * Link training to phase (for auto-advancement)
 */
export async function linkTraining(
  phaseId: string,
  trainingAssignmentId: string
) {
  try {
    await linkTrainingToPhase(phaseId, trainingAssignmentId);

    const phase = await prisma.journeyPhase.findUnique({
      where: { id: phaseId },
      include: { journey: true },
    });

    if (phase) {
      revalidatePath(`/admin/users/${phase.journey.userId}/journey`);
    }

    return {
      success: true,
      message: "Training linked successfully",
    };
  } catch (error) {
    console.error("Error linking training:", error);
    return {
      success: false,
      error: "Failed to link training",
    };
  }
}

/**
 * Delete a phase (only for custom phases in new employee journeys)
 */
export async function deleteJourneyPhase(phaseId: string) {
  try {
    const phase = await prisma.journeyPhase.findUnique({
      where: { id: phaseId },
      include: {
        journey: true,
      },
    });

    if (!phase) {
      return { success: false, error: "Phase not found" };
    }

    if (phase.journey.employeeType !== EmployeeType.NEW_EMPLOYEE) {
      return {
        success: false,
        error: "Can only delete custom phases from new employee journeys",
      };
    }

    if (phase.status !== PhaseStatus.NOT_STARTED) {
      return {
        success: false,
        error: "Cannot delete a phase that has already started",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete the phase
      await tx.journeyPhase.delete({
        where: { id: phaseId },
      });

      // Renumber subsequent phases
      await tx.$executeRaw`
        UPDATE "JourneyPhase"
        SET "phaseNumber" = "phaseNumber" - 1
        WHERE "journeyId" = ${phase.journeyId}
        AND "phaseNumber" > ${phase.phaseNumber}
      `;

      // Log activity
      await tx.journeyActivity.create({
        data: {
          journeyId: phase.journeyId,
          activityType: "PHASE_DELETED",
          title: "Phase Deleted",
          description: `Phase "${phase.title}" removed from journey`,
          userId: phase.journey.userId,
        },
      });
    });

    revalidatePath(`/admin/users/${phase.journey.userId}/journey`);

    return {
      success: true,
      message: "Phase deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting phase:", error);
    return {
      success: false,
      error: "Failed to delete phase",
    };
  }
}

/**
 * Update phase details (title, description, duration)
 */
export async function updatePhaseDetails(
  phaseId: string,
  data: {
    title?: string;
    description?: string;
    durationDays?: number;
  }
) {
  try {
    const phase = await prisma.journeyPhase.findUnique({
      where: { id: phaseId },
      include: {
        journey: true,
      },
    });

    if (!phase) {
      return { success: false, error: "Phase not found" };
    }

    // Calculate new due date if duration changed
    let newDueDate = phase.dueDate;
    if (data.durationDays && phase.startedAt && data.durationDays !== phase.durationDays) {
      newDueDate = new Date(phase.startedAt);
      newDueDate.setDate(newDueDate.getDate() + data.durationDays);
    }

    await prisma.$transaction(async (tx) => {
      // Update phase
      await tx.journeyPhase.update({
        where: { id: phaseId },
        data: {
          ...data,
          dueDate: newDueDate,
        },
      });

      // Log activity
      await tx.journeyActivity.create({
        data: {
          journeyId: phase.journeyId,
          activityType: "PHASE_UPDATED",
          title: "Phase Updated",
          description: `Phase "${phase.title}" details updated`,
          userId: phase.journey.userId,
        },
      });
    });

    revalidatePath(`/admin/users/${phase.journey.userId}/journey`);

    return {
      success: true,
      message: "Phase updated successfully",
    };
  } catch (error) {
    console.error("Error updating phase:", error);
    return {
      success: false,
      error: "Failed to update phase",
    };
  }
}

/**
 * Get all phases assigned to a mentor
 */
export async function getMentorPhases(mentorId: string) {
  try {
    const phases = await prisma.journeyPhase.findMany({
      where: {
        mentorId: mentorId,
      },
      include: {
        journey: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                designation: true,
                department: true,
              },
            },
          },
        },
        mentor: true,
      },
      orderBy: {
        startedAt: 'desc', // Most recent assignments first
      },
    });

    return {
      success: true,
      phases,
    };
  } catch (error) {
    console.error("Error retrieving mentor phases:", error);
    return {
      success: false,
      error: "Failed to retrieve mentor phases",
    };
  }
}
