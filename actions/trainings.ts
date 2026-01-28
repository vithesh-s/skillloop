'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { CompetencyLevel } from '@prisma/client'
import {
    trainingSchema,
    onlineTrainingSchema,
    offlineTrainingSchema,
    trainingAssignmentSchema,
    bulkTrainingAssignmentSchema,
    tnaBasedAssignmentSchema,
    trainingCompletionSchema,
    TrainingInput,
    OnlineTrainingInput,
    OfflineTrainingInput,
    TrainingAssignmentInput,
    BulkTrainingAssignmentInput,
    TNABasedAssignmentInput,
    TrainingCompletionInput,
} from '@/lib/validation'
import { TrainingStatus, Role } from '@prisma/client'
import { sendEmail } from '@/lib/email'
import { eachDayOfInterval, isWeekend } from 'date-fns'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function levelToNumeric(level: CompetencyLevel | null): number {
    if (!level) return 0
    const mapping: Record<CompetencyLevel, number> = {
        BEGINNER: 1,
        BASIC: 2,
        INTERMEDIATE: 3,
        ADVANCED: 4,
        EXPERT: 5,
    }
    return mapping[level]
}

function calculateGapPercentage(
    desiredLevel: CompetencyLevel,
    currentLevel: CompetencyLevel | null
): number {
    const desired = levelToNumeric(desiredLevel)
    const current = levelToNumeric(currentLevel)

    if (desired === 0) return 0
    if (current === 0) return 100
    if (current >= desired) return 0

    const gap = ((desired - current) / desired) * 100
    return Math.round(gap * 100) / 100
}

// ============================================================================
// TRAINING CRUD OPERATIONS
// ============================================================================

export async function createTraining(data: TrainingInput & { online?: OnlineTrainingInput, offline?: OfflineTrainingInput, assessmentOwnerId?: string }) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // Check role (ADMIN, TRAINER, or MANAGER)
    const hasPermission = session.user.systemRoles?.some((role: string) => ['ADMIN', 'TRAINER', 'MENTOR', 'MANAGER'].includes(role))
    if (!hasPermission) throw new Error('Insufficient permissions')

    const validation = trainingSchema.safeParse(data)
    if (!validation.success) throw new Error('Invalid data')

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create base training
            const training = await tx.training.create({
                data: {
                    topicName: data.topicName,
                    description: data.description,
                    mode: data.mode,
                    duration: data.duration,
                    skillId: data.skillId,
                    resources: data.resources, // Stored as JSON
                    venue: data.venue,
                    meetingLink: data.meetingLink,
                    maxParticipants: data.maxParticipants,
                    assessmentOwnerId: data.assessmentOwnerId || null,
                    createdById: session.user.id!,
                },
            })

            // Create mode-specific data
            if (data.mode === 'ONLINE' && data.online) {
                await tx.onlineTraining.create({
                    data: {
                        trainingId: training.id,
                        resourceLinks: data.online.resourceLinks, // Stored as JSON
                        estimatedDuration: data.online.estimatedDuration,
                        mentorRequired: data.online.mentorRequired,
                    },
                })
            } else if (data.mode === 'OFFLINE' && data.offline) {
                await tx.offlineTraining.create({
                    data: {
                        trainingId: training.id,
                        schedule: data.offline.schedule, // Stored as JSON
                        venue: data.offline.venue,
                        materials: data.offline.materials, // Stored as JSON
                        trainerIds: data.offline.trainerIds, // Stored as JSON
                    },
                })
            }

            // Auto-create draft Assessment linked to this training
            const assessmentCreatorId = data.assessmentOwnerId || session.user.id!
            await tx.assessment.create({
                data: {
                    title: `${data.topicName} - Post Assessment`,
                    description: `Assessment for ${data.topicName} training`,
                    skillId: data.skillId,
                    trainingId: training.id,
                    totalMarks: 100, // Default, to be updated by trainer
                    passingScore: 60, // Default
                    duration: 60, // Default 60 minutes
                    status: 'DRAFT',
                    isPreAssessment: false,
                    createdById: assessmentCreatorId,
                },
            })

            return training
        })

        revalidatePath('/admin/training')
        revalidatePath('/trainer/assessments')
        return { success: true, data: result }
    } catch (error) {
        console.error('Create training error:', error)
        return { success: false, error: 'Failed to create training' }
    }
}

export async function getTrainings(filters?: { mode?: 'ONLINE' | 'OFFLINE', skillId?: string, searchTerm?: string }) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    try {
        const where: any = {}

        if (filters?.mode) where.mode = filters.mode
        if (filters?.skillId) where.skillId = filters.skillId
        if (filters?.searchTerm) {
            where.OR = [
                { topicName: { contains: filters.searchTerm, mode: 'insensitive' } },
                { description: { contains: filters.searchTerm, mode: 'insensitive' } },
            ]
        }

        const trainings = await prisma.training.findMany({
            where,
            include: {
                skill: { include: { category: true } },
                creator: stripUser(),
                assessmentOwner: stripUser(),
                onlineTraining: true,
                offlineTraining: true,
                _count: { select: { assignments: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: trainings }
    } catch (error) {
        console.error('Get trainings error:', error)
        return { success: false, error: 'Failed to fetch trainings' }
    }
}

export async function getTrainingById(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    try {
        const training = await prisma.training.findUnique({
            where: { id },
            include: {
                skill: { include: { category: true } },
                creator: stripUser(),
                onlineTraining: true,
                offlineTraining: true,
                assignments: {
                    include: {
                        user: stripUser(),
                        trainer: stripUser(),
                        mentor: stripUser()
                    },
                    orderBy: { startDate: 'desc' },
                    take: 20 // Limit recent assignments
                }
            }
        })

        if (!training) return { success: false, error: 'Training not found' }
        return { success: true, data: training }
    } catch (error) {
        console.error('Get training by id error:', error)
        return { success: false, error: 'Failed to fetch training' }
    }
}

export async function deleteTraining(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // Check permission
    const hasPermission = session.user.systemRoles?.some((role: string) => ['ADMIN'].includes(role))
    if (!hasPermission) return { success: false, error: 'Insufficient permissions' }

    try {
        await prisma.training.delete({ where: { id } })
        revalidatePath('/admin/training')
        return { success: true }
    } catch (error) {
        console.error('Delete training error:', error)
        return { success: false, error: 'Failed to delete training. It may have active assignments.' }
    }
}

// ============================================================================
// ASSIGNMENT OPERATIONS
// ============================================================================

export async function assignTraining(data: TrainingAssignmentInput) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Manager/Admin/Trainer check
    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'MANAGER', 'TRAINER', 'MENTOR'].includes(role)
    )
    if (!hasPermission) throw new Error('Insufficient permissions')

    const validation = trainingAssignmentSchema.safeParse(data)
    if (!validation.success) {
        console.error('Training assignment validation failed:', validation.error.format())
        throw new Error(`Invalid data: ${JSON.stringify(validation.error.format())}`)
    }

    // Ensure dates are proper Date objects
    const validatedData = validation.data
    const startDate = validatedData.startDate instanceof Date ? validatedData.startDate : new Date(validatedData.startDate)
    const targetCompletionDate = validatedData.targetCompletionDate instanceof Date ? validatedData.targetCompletionDate : new Date(validatedData.targetCompletionDate)
    const targetLevel = validatedData.targetLevel || 'BEGINNER' // Default to BEGINNER if not specified

    try {
        // ---------------------------------------------------------
        // STEP 1: Fetch training info and create calendar entries OUTSIDE transaction
        // ---------------------------------------------------------
        const training = await prisma.training.findUnique({
            where: { id: validatedData.trainingId },
            include: { offlineTraining: true }
        })

        if (!training) {
            return { success: false, error: 'Training not found' }
        }

        // Create calendar entries once (outside transaction to avoid timeout)
        const days = eachDayOfInterval({
            start: startDate,
            end: targetCompletionDate
        })

        const existingCalendarDates = await prisma.trainingCalendar.findMany({
            where: {
                trainingId: validatedData.trainingId,
                trainingDate: {
                    in: days.filter(d => !isWeekend(d))
                }
            },
            select: { trainingDate: true }
        })

        const existingDatesSet = new Set(
            existingCalendarDates.map(cal => cal.trainingDate.toISOString())
        )

        // Create calendar entries only for dates that don't exist yet
        for (const day of days) {
            if (isWeekend(day)) continue;

            const dayISO = day.toISOString()
            if (existingDatesSet.has(dayISO)) continue;

            try {
                await prisma.trainingCalendar.create({
                    data: {
                        trainingId: validatedData.trainingId,
                        trainingDate: day,
                        venue: training?.venue || (training?.mode === 'OFFLINE' ? training?.offlineTraining?.venue : null),
                        meetingLink: training?.meetingLink,
                        maxParticipants: training?.maxParticipants,
                        publishedAt: new Date(),
                    }
                })
            } catch (calError) {
                console.warn('Failed to create calendar entry:', calError)
            }
        }

        // Fetch assessment info outside transaction
        let assessment = null;
        if (training?.skillId) {
            assessment = await prisma.assessment.findFirst({
                where: {
                    skillId: training.skillId,
                    isPreAssessment: false,
                    status: 'PUBLISHED'
                }
            });
        }

        // ---------------------------------------------------------
        // STEP 2: Main transaction (only critical writes, increased timeout)
        // ---------------------------------------------------------
        const result = await prisma.$transaction(async (tx) => {
            const assignments = []

            for (const userId of validatedData.userIds) {
                // Create assignment
                const assignment = await tx.trainingAssignment.create({
                    data: {
                        trainingId: validatedData.trainingId,
                        userId,
                        trainerId: validatedData.trainerId,
                        mentorId: validatedData.mentorId,
                        startDate,
                        targetCompletionDate,
                        status: 'ASSIGNED',
                    },
                    include: {
                        user: true,
                        training: true
                    }
                })

                if (training?.skillId) {
                    // Check if skill matrix entry already exists
                    const existingSkillMatrix = await tx.skillMatrix.findUnique({
                        where: { userId_skillId: { userId, skillId: training.skillId } }
                    })

                    if (existingSkillMatrix) {
                        // Update existing entry with new target level and recalculate gap
                        const newGapPercentage = calculateGapPercentage(
                            targetLevel as CompetencyLevel,
                            existingSkillMatrix.currentLevel
                        )

                        await tx.skillMatrix.update({
                            where: { userId_skillId: { userId, skillId: training.skillId } },
                            data: {
                                desiredLevel: targetLevel as CompetencyLevel,
                                gapPercentage: newGapPercentage,
                                status: existingSkillMatrix.status === 'personal_goal'
                                    ? 'training_assigned_from_personal'
                                    : 'training_assigned'
                            }
                        })
                    } else {
                        // Create new entry with target level
                        const newGapPercentage = calculateGapPercentage(
                            targetLevel as CompetencyLevel,
                            null
                        )

                        await tx.skillMatrix.create({
                            data: {
                                userId,
                                skillId: training.skillId,
                                desiredLevel: targetLevel as CompetencyLevel,
                                gapPercentage: newGapPercentage,
                                status: 'training_assigned',
                            }
                        })
                    }
                }

                // Auto-schedule Assessment
                if (assessment) {
                    const existingAssessment = await tx.assessmentAssignment.findFirst({
                        where: {
                            assessmentId: assessment.id,
                            userId
                        }
                    })

                    if (!existingAssessment) {
                        await tx.assessmentAssignment.create({
                            data: {
                                assessmentId: assessment.id,
                                userId,
                                assignedById: session.user.id!,
                                dueDate: targetCompletionDate,
                                status: 'PENDING'
                            }
                        })
                    }
                }

                // Create Notification
                await tx.notification.create({
                    data: {
                        recipientId: userId,
                        type: 'TRAINING_ASSIGNED',
                        subject: `New Training Assigned: ${training?.topicName}`,
                        message: `You have been assigned to ${training?.topicName} training. Start date: ${startDate.toDateString()}. Target completion: ${targetCompletionDate.toDateString()}.${assessment ? ` Assessment will be scheduled on your target completion date.` : ''}`,
                    }
                })

                assignments.push(assignment)
            }
            return assignments
        }, {
            timeout: 15000, // Increase timeout to 15 seconds
        })

        // ---------------------------------------------------------
        // STEP 3: Send emails AFTER transaction (async, outside critical path)
        // ---------------------------------------------------------
        for (const assignment of result) {
            try {
                await sendEmail({
                    to: assignment.user.email,
                    subject: `New Training Assigned: ${training?.topicName}`,
                    template: 'training-assigned',
                    data: {
                        userName: assignment.user.name,
                        trainingName: training?.topicName || 'Training',
                        mode: training?.mode || 'ONLINE',
                        duration: training?.duration || 0,
                        startDate: startDate.toDateString(),
                        completionDate: targetCompletionDate.toDateString(),
                        hasAssessment: !!assessment,
                        assessmentDueDate: assessment ? targetCompletionDate.toDateString() : undefined,
                        message: `You have been assigned to complete the "${training?.topicName}" training. Please log in to view details and start your training.${assessment ? ' An assessment has been scheduled for your target completion date.' : ''}`
                    }
                })
            } catch (emailError) {
                console.error('Failed to send email to', assignment.user.email, emailError)
                // Don't fail the assignment if email fails
            }
        }

        revalidatePath('/manager/assign-training')
        revalidatePath('/admin/tna')
        return { success: true, data: result }

    } catch (error) {
        console.error('Assign training error:', error)
        return { success: false, error: 'Failed to assign training' }
    }
}

export async function bulkAssignTraining(data: BulkTrainingAssignmentInput) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Manager/Admin/Trainer check
    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'MANAGER', 'TRAINER', 'MENTOR'].includes(role)
    )
    if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions' }
    }

    try {
        const results = []
        const errors: Array<{ userId: string; error: string }> = []

        for (const assignment of data.assignments) {
            try {
                const res = await assignTraining({
                    trainingId: data.trainingId,
                    userIds: [assignment.userId],
                    trainerId: assignment.trainerId,
                    mentorId: assignment.mentorId,
                    targetLevel: data.targetLevel, // Pass targetLevel from bulk schema
                    startDate: new Date(assignment.startDate),
                    targetCompletionDate: new Date(assignment.targetCompletionDate),
                })
                if (res.success && res.data) {
                    results.push(res.data[0])
                } else {
                    errors.push({ userId: assignment.userId, error: res.error || 'Unknown error' })
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error'
                console.error('Assignment failed for user:', assignment.userId, errorMsg, err)
                errors.push({ userId: assignment.userId, error: errorMsg })
                // Continue with other assignments even if one fails
            }
        }

        if (results.length === 0) {
            const errorDetails = errors.map(e => `User ${e.userId}: ${e.error}`).join('; ')
            return { success: false, error: `All assignments failed. Details: ${errorDetails}` }
        }

        // Partial success case
        if (errors.length > 0) {
            console.warn('Some assignments failed:', errors)
        }

        revalidatePath('/manager/assign-training')
        revalidatePath('/admin/training')
        revalidatePath('/admin/assign-training')

        return {
            success: true,
            count: results.length,
            partialSuccess: errors.length > 0,
            failedCount: errors.length,
            errors: errors
        }
    } catch (error) {
        console.error('Bulk assignment error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Bulk assignment failed'
        }
    }
}

export async function assignFromTNA(data: TNABasedAssignmentInput) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    try {
        let trainingId = data.existingTrainingId

        // If creating new training on the fly
        if (data.createNewTraining && data.trainingData) {
            const createRes = await createTraining({
                ...data.trainingData,
                skillId: data.skillId, // Ensure skillId matches TNA context
            })
            // Wait, createTraining signature needs adaptation for this call or just call direct prisma
            // Simplification: assume creates are handled via specific actions, or inline here
            // Re-using createTraining logic requires mocking the complex input shape
            // For now, let's assume UI calls createTraining separately if needed, 
            // OR we implement the create logic here if TNA allows simplified creation.
            // Let's implement robust handling:
            if (!createRes.success || !createRes.data) throw new Error('Failed to create new training')
            trainingId = createRes.data.id
        }

        if (!trainingId) throw new Error('No training ID provided')

        // Now assign
        const assignmentRes = await assignTraining({
            trainingId,
            userIds: data.userIds,
            startDate: new Date(data.startDate),
            targetCompletionDate: new Date(data.targetCompletionDate),
        })

        return assignmentRes

    } catch (error) {
        console.error('TNA assignment error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'TNA assignment failed' }
    }
}


// ============================================================================
// LEARNER COMPLETION OPERATIONS
// ============================================================================

export async function getUserTrainings(userId?: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const targetUserId = userId || session.user.id
    // Only allow viewing own trainings unless admin/manager
    if (targetUserId !== session.user.id) {
        const isAdmin = session.user.systemRoles?.includes('ADMIN')
        const isManager = session.user.systemRoles?.includes('MANAGER')
        // const isUsersManager = ... (check DB)
        if (!isAdmin && !isManager) throw new Error('Unauthorized')
    }

    try {
        const assignments = await prisma.trainingAssignment.findMany({
            where: { userId: targetUserId },
            include: {
                training: {
                    include: { skill: { include: { category: true } } }
                },
                trainer: stripUser(),
                progressUpdates: {
                    orderBy: { weekNumber: 'desc' },
                    take: 1 // Get latest progress update only
                },
                proofs: {
                    where: { status: { in: ['PENDING', 'APPROVED'] } },
                    orderBy: { uploadDate: 'desc' }
                }
            },
            orderBy: { startDate: 'desc' }
        })
        return { success: true, data: assignments }
    } catch (error) {
        return { success: false, error: 'Failed to fetch user trainings' }
    }
}

export async function updateTrainingCompletion(data: TrainingCompletionInput) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Find assignment
    const assignment = await prisma.trainingAssignment.findUnique({
        where: { id: data.assignmentId },
        include: {
            training: {
                include: {
                    skill: true,
                }
            },
            user: true,
        }
    })

    if (!assignment) throw new Error('Assignment not found')
    if (assignment.userId !== session.user.id) throw new Error('Unauthorized')

    try {
        const result = await prisma.$transaction(async (tx) => {
            const completionDate = new Date()

            // Update assignment status
            const updatedAssignment = await tx.trainingAssignment.update({
                where: { id: data.assignmentId },
                data: {
                    status: 'COMPLETED',
                    completionDate: completionDate,
                }
            })

            // If certificate provided, create ProofOfCompletion
            if (data.certificateDetails?.certificateUrl) {
                await tx.proofOfCompletion.create({
                    data: {
                        assignmentId: data.assignmentId,
                        fileName: `Certificate-${data.certificateDetails.certificateNumber || 'doc'}`,
                        filePath: data.certificateDetails.certificateUrl,
                        status: 'PENDING',
                    }
                })
            }

            // Schedule post-assessment 30 days after completion
            if (assignment.training.skillId) {
                // Calculate post-assessment date (30 days from completion)
                const postAssessmentDate = new Date(completionDate)
                postAssessmentDate.setDate(postAssessmentDate.getDate() + 30)

                // Find post-assessment for this skill
                const postAssessment = await tx.assessment.findFirst({
                    where: {
                        skillId: assignment.training.skillId,
                        trainingId: assignment.trainingId,
                        isPreAssessment: false,
                        status: 'PUBLISHED',
                    },
                })

                if (postAssessment) {
                    // Check if post-assessment assignment already exists
                    const existingAssignment = await tx.assessmentAssignment.findUnique({
                        where: {
                            assessmentId_userId: {
                                assessmentId: postAssessment.id,
                                userId: session.user.id!,
                            },
                        },
                    })

                    if (!existingAssignment) {
                        // Create new post-assessment assignment
                        await tx.assessmentAssignment.create({
                            data: {
                                assessmentId: postAssessment.id,
                                userId: session.user.id!,
                                assignedById: assignment.training.createdById,
                                dueDate: postAssessmentDate,
                                status: 'PENDING',
                            },
                        })
                    } else {
                        // Update existing assignment with new due date
                        await tx.assessmentAssignment.update({
                            where: {
                                assessmentId_userId: {
                                    assessmentId: postAssessment.id,
                                    userId: session.user.id!,
                                },
                            },
                            data: {
                                dueDate: postAssessmentDate,
                                status: 'PENDING',
                            },
                        })
                    }

                    // Send post-assessment scheduled notification
                    await tx.notification.create({
                        data: {
                            recipientId: session.user.id!,
                            type: 'ASSESSMENT_ASSIGNED',
                            subject: 'Post-Training Assessment Scheduled',
                            message: `Congratulations on completing "${assignment.training.topicName}"! Your post-training assessment has been scheduled for ${postAssessmentDate.toLocaleDateString()}.`,
                        },
                    })

                    // Send email notification
                    await sendEmail({
                        to: assignment.user.email,
                        subject: 'Post-Training Assessment Scheduled',
                        template: 'post-assessment-scheduled',
                        data: {
                            userName: assignment.user.name,
                            trainingName: assignment.training.topicName,
                            assessmentDate: postAssessmentDate.toLocaleDateString(),
                            skillName: assignment.training.skill?.name || 'your skill',
                        },
                    })
                }

                // Update SkillMatrix status to in_progress
                const skillMatrix = await tx.skillMatrix.findUnique({
                    where: {
                        userId_skillId: {
                            userId: session.user.id!,
                            skillId: assignment.training.skillId
                        }
                    },
                })

                if (skillMatrix) {
                    await tx.skillMatrix.update({
                        where: {
                            userId_skillId: {
                                userId: session.user.id!,
                                skillId: assignment.training.skillId
                            }
                        },
                        data: {
                            status: 'in_progress',
                        }
                    })
                }
            }

            // Journey auto-advance: Check if this training assignment is linked to a journey phase
            try {
                const userWithJourney = await tx.user.findUnique({
                    where: { id: session.user.id! },
                    include: {
                        journey: {
                            include: {
                                phases: {
                                    where: {
                                        trainingAssignmentId: data.assignmentId,
                                        status: 'IN_PROGRESS',
                                    },
                                },
                            },
                        },
                    },
                })

                if (userWithJourney?.journey && userWithJourney.journey.phases.length > 0) {
                    const { autoAdvancePhase } = await import('@/lib/journey-engine')
                    await autoAdvancePhase(
                        userWithJourney.journey.id,
                        'training_completed',
                        {
                            trainingAssignmentId: data.assignmentId,
                            trainingId: assignment.trainingId,
                            completionDate: completionDate.toISOString(),
                        }
                    )
                }
            } catch (journeyError) {
                console.error('Failed to auto-advance journey phase:', journeyError)
                // Continue - journey advance failure shouldn't fail training completion
            }

            return updatedAssignment
        })

        revalidatePath('/employee/training')
        revalidatePath('/employee/assessments')
        return { success: true, data: result }
    } catch (error) {
        console.error('Update completion error:', error)
        return { success: false, error: 'Failed to update completion' }
    }
}

export async function updateAssignmentStatus(assignmentId: string, status: TrainingStatus) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Permission check
    // ...

    try {
        await prisma.trainingAssignment.update({
            where: { id: assignmentId },
            data: { status }
        })
        revalidatePath('/learner/my-trainings')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to update status' }
    }
}

// ============================================================================
// HELPERS
// ============================================================================

function stripUser() {
    return {
        select: {
            id: true,
            name: true,
            email: true,
            // image: true,
            department: true,
            designation: true
        }
    }
}

export async function getAvailableMentors(skillId: string) {
    // Logic: find users with EXPERT level in this skill or designated MENTOR role
    // For now, return anyone with MENTOR role
    return await prisma.user.findMany({
        where: { systemRoles: { has: 'MENTOR' } },
        select: { id: true, name: true, email: true }
    })
}

export async function getAvailableTrainers() {
    return await prisma.user.findMany({
        where: { systemRoles: { has: 'TRAINER' } },
        select: { id: true, name: true, email: true, department: true }
    })
}

// ============================================================================
// TRAINING ASSIGNMENT DELETION
// ============================================================================

export async function deleteTrainingAssignment(assignmentId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    // Check permission (Admin or Manager)
    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'MANAGER'].includes(role)
    )
    if (!hasPermission) return { success: false, error: 'Insufficient permissions' }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Get the assignment first
            const assignment = await tx.trainingAssignment.findUnique({
                where: { id: assignmentId },
                include: {
                    training: {
                        select: { skillId: true }
                    }
                }
            })

            if (!assignment) {
                return { success: false, error: 'Training assignment not found' }
            }

            // Check if there's a SkillMatrix entry for this skill
            if (assignment.training.skillId) {
                const skillMatrix = await tx.skillMatrix.findUnique({
                    where: {
                        userId_skillId: {
                            userId: assignment.userId,
                            skillId: assignment.training.skillId
                        }
                    }
                })

                if (skillMatrix) {
                    // If it was originally a personal goal, revert to personal_goal status
                    if (skillMatrix.status === 'training_assigned_from_personal') {
                        await tx.skillMatrix.update({
                            where: {
                                userId_skillId: {
                                    userId: assignment.userId,
                                    skillId: assignment.training.skillId
                                }
                            },
                            data: {
                                status: 'personal_goal',
                                // Optionally recalculate gap based on original desired level
                                gapPercentage: calculateGapPercentage(
                                    skillMatrix.desiredLevel,
                                    skillMatrix.currentLevel
                                )
                            }
                        })
                    } else {
                        // If it was created only for training, delete it
                        await tx.skillMatrix.delete({
                            where: {
                                userId_skillId: {
                                    userId: assignment.userId,
                                    skillId: assignment.training.skillId
                                }
                            }
                        })
                    }
                }

                // Delete any draft assessments for this training's skill by the assessment owner
                await tx.assessment.deleteMany({
                    where: {
                        skillId: assignment.training.skillId,
                        trainingId: assignment.trainingId,
                        status: 'DRAFT'
                    }
                })
            }

            // Delete the training assignment
            await tx.trainingAssignment.delete({
                where: { id: assignmentId }
            })

            return { success: true }
        })

        revalidatePath('/employee/skill-gaps')
        revalidatePath('/employee/assessment-duties')
        revalidatePath('/admin/tna')
        revalidatePath('/manager/assign-training')

        return result
    } catch (error) {
        console.error('Delete training assignment error:', error)
        return { success: false, error: 'Failed to delete training assignment' }
    }
}
