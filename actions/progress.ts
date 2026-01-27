'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { progressUpdateSchema, mentorCommentSchema, type ProgressUpdateInput, type MentorCommentInput } from '@/lib/validation'

/**
 * Create or update weekly progress for an online training assignment
 * Automatically upserts based on assignmentId + weekNumber
 */
export async function createProgressUpdate(data: ProgressUpdateInput) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    try {
        // Validate input
        const validated = progressUpdateSchema.parse(data)

        // Verify assignment exists and belongs to user
        const assignment = await prisma.trainingAssignment.findUnique({
            where: { id: validated.assignmentId },
            include: {
                training: {
                    select: {
                        topicName: true,
                        mode: true
                    }
                },
                mentor: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!assignment) {
            return { success: false, error: 'Training assignment not found' }
        }

        if (assignment.userId !== session.user.id) {
            return { success: false, error: 'You are not authorized to update this training' }
        }

        if (assignment.training.mode !== 'ONLINE') {
            return { success: false, error: 'Progress updates are only for online training' }
        }

        // Upsert progress update
        const progress = await prisma.progressUpdate.upsert({
            where: {
                assignmentId_weekNumber: {
                    assignmentId: validated.assignmentId,
                    weekNumber: validated.weekNumber
                }
            },
            create: {
                assignmentId: validated.assignmentId,
                weekNumber: validated.weekNumber,
                completionPercentage: validated.completionPercentage,
                topicsCovered: validated.topicsCovered,
                timeSpent: validated.timeSpent,
                challenges: validated.challenges,
                nextPlan: validated.nextPlan,
                updateDate: validated.updateDate
            },
            update: {
                completionPercentage: validated.completionPercentage,
                topicsCovered: validated.topicsCovered,
                timeSpent: validated.timeSpent,
                challenges: validated.challenges,
                nextPlan: validated.nextPlan,
                updateDate: validated.updateDate
            }
        })

        // If this is the first progress update, change status to IN_PROGRESS
        if (assignment.status === 'ASSIGNED') {
            await prisma.trainingAssignment.update({
                where: { id: validated.assignmentId },
                data: { status: 'IN_PROGRESS' }
            })
        }

        // Send notification to mentor if assigned
        if (assignment.mentorId && assignment.mentor) {
            await prisma.notification.create({
                data: {
                    recipientId: assignment.mentorId,
                    type: 'TRAINING_PROGRESS_UPDATED',
                    subject: `Progress Update - Week ${validated.weekNumber}`,
                    message: `${session.user.name} has submitted progress for week ${validated.weekNumber} of ${assignment.training.topicName}. Completion: ${validated.completionPercentage}%`
                }
            })
        }

        revalidatePath('/employee/training/[id]/progress', 'page')
        revalidatePath('/trainer/review-progress')

        return { success: true, data: progress }
    } catch (error) {
        console.error('Create progress update error:', error)
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Failed to create progress update' }
    }
}

/**
 * Get all progress updates for a training assignment with statistics
 */
export async function getProgressUpdates(assignmentId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    try {
        // Verify authorization
        const assignment = await prisma.trainingAssignment.findUnique({
            where: { id: assignmentId },
            select: {
                userId: true,
                trainerId: true,
                mentorId: true
            }
        })

        if (!assignment) {
            return { success: false, error: 'Assignment not found' }
        }

        const roles = session.user.systemRoles || []
        const isAuthorized =
            assignment.userId === session.user.id ||
            assignment.trainerId === session.user.id ||
            assignment.mentorId === session.user.id ||
            roles.includes('ADMIN')

        if (!isAuthorized) {
            return { success: false, error: 'Unauthorized' }
        }

        // Fetch all progress updates
        const updates = await prisma.progressUpdate.findMany({
            where: { assignmentId },
            orderBy: { weekNumber: 'asc' }
        })

        // Calculate statistics
        const stats = {
            totalWeeks: updates.length,
            averageCompletion: updates.length > 0
                ? Math.round(updates.reduce((sum: number, u: { completionPercentage: number }) => sum + u.completionPercentage, 0) / updates.length)
                : 0,
            totalTimeSpent: updates.reduce((sum: number, u: { timeSpent: number | null }) => sum + (u.timeSpent || 0), 0),
            lastUpdateDate: updates.length > 0
                ? updates[updates.length - 1].createdAt
                : null
        }

        return { success: true, data: { updates, stats } }
    } catch (error) {
        console.error('Get progress updates error:', error)
        return { success: false, error: 'Failed to fetch progress updates' }
    }
}

/**
 * Get comprehensive progress data for an assignment (for detail view)
 */
export async function getAssignmentProgress(assignmentId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    try {
        const assignment = await prisma.trainingAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                training: {
                    include: {
                        skill: {
                            select: {
                                name: true,
                                category: {
                                    select: {
                                        name: true,
                                        colorClass: true
                                    }
                                }
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: true
                    }
                },
                trainer: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                mentor: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                progressUpdates: {
                    orderBy: { weekNumber: 'asc' }
                },
                proofs: {
                    orderBy: { uploadDate: 'desc' },
                    include: {
                        reviewer: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!assignment) {
            return { success: false, error: 'Assignment not found' }
        }

        // Authorization check
        const roles = session.user.systemRoles || []
        const isAuthorized =
            assignment.userId === session.user.id ||
            assignment.trainerId === session.user.id ||
            assignment.mentorId === session.user.id ||
            roles.includes('ADMIN')

        if (!isAuthorized) {
            return { success: false, error: 'Unauthorized' }
        }

        // Calculate statistics
        const stats = {
            totalWeeks: assignment.progressUpdates.length,
            completedWeeks: assignment.progressUpdates.filter(u => u.completionPercentage === 100).length,
            averageCompletion: assignment.progressUpdates.length > 0
                ? Math.round(assignment.progressUpdates.reduce((sum: number, u: { completionPercentage: number }) => sum + u.completionPercentage, 0) / assignment.progressUpdates.length)
                : 0,
            totalTimeSpent: assignment.progressUpdates.reduce((sum: number, u: { timeSpent: number | null }) => sum + (u.timeSpent || 0), 0),
            lastUpdateDate: assignment.progressUpdates.length > 0
                ? assignment.progressUpdates[assignment.progressUpdates.length - 1].createdAt
                : null,
            approvedProofs: assignment.proofs.filter(p => p.status === 'APPROVED').length,
            pendingProofs: assignment.proofs.filter(p => p.status === 'PENDING').length
        }

        return { success: true, data: { assignment, stats } }
    } catch (error) {
        console.error('Get assignment progress error:', error)
        return { success: false, error: 'Failed to fetch assignment progress' }
    }
}

/**
 * Add mentor comment to a progress update
 */
export async function addMentorComment(data: MentorCommentInput) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    try {
        // Validate input
        const validated = mentorCommentSchema.parse(data)

        // Verify progress update exists
        const progress = await prisma.progressUpdate.findUnique({
            where: { id: validated.progressId },
            include: {
                assignment: {
                    include: {
                        training: {
                            select: { topicName: true }
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        if (!progress) {
            return { success: false, error: 'Progress update not found' }
        }

        // Verify user is mentor, trainer, or admin
        const roles = session.user.systemRoles || []
        const isAuthorized =
            progress.assignment.mentorId === session.user.id ||
            progress.assignment.trainerId === session.user.id ||
            roles.includes('ADMIN')

        if (!isAuthorized) {
            return { success: false, error: 'Only mentors, trainers, or admins can add comments' }
        }

        // Update progress with mentor comment
        const updated = await prisma.progressUpdate.update({
            where: { id: validated.progressId },
            data: {
                mentorComments: validated.comment
            }
        })

        // Notify the trainee
        await prisma.notification.create({
            data: {
                recipientId: progress.assignment.userId,
                type: 'TRAINING_FEEDBACK',
                subject: 'Mentor Feedback Received',
                message: `Your mentor has provided feedback on your Week ${progress.weekNumber} progress for ${progress.assignment.training.topicName}`
            }
        })

        revalidatePath('/employee/training/[id]/progress', 'page')
        revalidatePath('/trainer/review-progress')

        return { success: true, data: updated }
    } catch (error) {
        console.error('Add mentor comment error:', error)
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Failed to add mentor comment' }
    }
}

/**
 * Get list of trainings requiring mentor review (for mentor dashboard)
 */
export async function getTrainingsForReview(mentorId?: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    const effectiveMentorId = mentorId || session.user.id

    try {
        const assignments = await prisma.trainingAssignment.findMany({
            where: {
                mentorId: effectiveMentorId,
                status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
            },
            include: {
                training: {
                    select: {
                        topicName: true,
                        skill: {
                            select: {
                                name: true,
                                category: {
                                    select: {
                                        colorClass: true
                                    }
                                }
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        department: true
                    }
                },
                progressUpdates: {
                    orderBy: { weekNumber: 'desc' },
                    take: 1
                },
                proofs: {
                    where: { status: 'PENDING' },
                    orderBy: { uploadDate: 'desc' }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        })

        // Calculate summary stats for each assignment
        const enriched = assignments.map(assignment => {
            const latestProgress = assignment.progressUpdates[0]
            const daysSinceUpdate = latestProgress
                ? Math.floor((new Date().getTime() - latestProgress.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                : null

            return {
                ...assignment,
                latestProgress,
                daysSinceUpdate,
                isOverdue: daysSinceUpdate !== null && daysSinceUpdate > 7,
                pendingProofCount: assignment.proofs.length
            }
        })

        return { success: true, data: enriched }
    } catch (error) {
        console.error('Get trainings for review error:', error)
        return { success: false, error: 'Failed to fetch trainings for review' }
    }
}
