'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
    feedbackSchema,
    feedbackFilterSchema,
    FeedbackInput,
    FeedbackFilterInput,
} from '@/lib/validation'
import { sendEmail } from '@/lib/email'

// ============================================================================
// FEEDBACK SUBMISSION
// ============================================================================

export async function submitFeedback(data: FeedbackInput) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // Validate input
    const validation = feedbackSchema.safeParse(data)
    if (!validation.success) {
        throw new Error('Invalid feedback data: ' + validation.error.message)
    }

    try {
        // Verify assignment exists and belongs to user
        const assignment = await prisma.trainingAssignment.findFirst({
            where: {
                id: data.assignmentId,
                userId: session.user.id,
                status: 'COMPLETED',
            },
            include: {
                training: {
                    include: {
                        skill: true,
                    },
                },
                trainer: true,
                user: true,
            },
        })

        if (!assignment) {
            throw new Error('Training assignment not found or not completed')
        }

        // Check if feedback already exists
        const existingFeedback = await prisma.feedback.findFirst({
            where: {
                assignmentId: data.assignmentId,
            },
        })

        if (existingFeedback) {
            throw new Error('Feedback already submitted for this training')
        }

        // Calculate average rating
        const avgRating = (
            data.materialHelpful +
            data.interactiveEngaging +
            data.trainerAnswered +
            data.contentSatisfaction
        ) / 4

        // Map quality rating to numeric
        const qualityMap = {
            'Excellent': 5,
            'Good': 4,
            'Average': 3,
            'Below Average': 2,
        }

        // Create feedback with extended fields stored in comments as JSON
        const feedbackData = {
            likeMost: data.likeMost,
            keyLearnings: data.keyLearnings,
            confusingTopics: data.confusingTopics || '',
            materialHelpful: data.materialHelpful,
            interactiveEngaging: data.interactiveEngaging,
            trainerAnswered: data.trainerAnswered,
            qualityRating: data.qualityRating,
            contentSatisfaction: data.contentSatisfaction,
            competentConfident: data.competentConfident,
            suggestions: data.suggestions || '',
        }

        const feedback = await prisma.feedback.create({
            data: {
                assignmentId: data.assignmentId,
                submittedById: session.user.id,
                trainerRating: data.trainerAnswered,
                contentRating: data.contentSatisfaction,
                logisticsRating: data.materialHelpful,
                overallRating: Math.round(avgRating),
                comments: JSON.stringify(feedbackData), // Store full feedback as JSON
            },
        })

        // Create notification for admin and trainer
        const notificationPromises = []

        // Notify admins
        const admins = await prisma.user.findMany({
            where: {
                systemRoles: {
                    has: 'ADMIN',
                },
            },
        })

        for (const admin of admins) {
            notificationPromises.push(
                prisma.notification.create({
                    data: {
                        recipientId: admin.id,
                        type: 'TRAINING_FEEDBACK',
                        subject: 'New Training Feedback',
                        message: `${assignment.user.name} submitted feedback for ${assignment.training.topicName}`,
                    },
                })
            )
        }

        // Notify trainer if assigned
        if (assignment.trainer) {
            notificationPromises.push(
                prisma.notification.create({
                    data: {
                        recipientId: assignment.trainer.id,
                        type: 'TRAINING_FEEDBACK',
                        subject: 'New Training Feedback',
                        message: `${assignment.user.name} submitted feedback for ${assignment.training.topicName}`,
                    },
                })
            )

            // Send email to trainer
            notificationPromises.push(
                sendEmail({
                    to: assignment.trainer.email,
                    subject: 'Training Feedback Received',
                    template: 'general',
                    data: {
                        message: `${assignment.user.name} has submitted feedback for the training "${assignment.training.topicName}". Overall rating: ${Math.round(avgRating)}/5`,
                    },
                })
            )
        }

        // Send thank you email to learner
        notificationPromises.push(
            sendEmail({
                to: assignment.user.email,
                subject: 'Thank You for Your Feedback',
                template: 'general',
                data: {
                    message: `Thank you for providing feedback on "${assignment.training.topicName}". Your input helps us improve our training programs.`,
                },
            })
        )

        await Promise.all(notificationPromises)

        revalidatePath('/employee/training')
        revalidatePath('/admin/reports/feedback')

        return {
            success: true,
            message: 'Feedback submitted successfully',
            feedbackId: feedback.id,
        }
    } catch (error: any) {
        console.error('Submit feedback error:', error)
        throw new Error(error.message || 'Failed to submit feedback')
    }
}

// ============================================================================
// GET TRAINING FEEDBACK
// ============================================================================

export async function getTrainingFeedback(trainingId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // Check permissions (admin or trainer)
    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'TRAINER'].includes(role)
    )
    if (!hasPermission) throw new Error('Insufficient permissions')

    try {
        const feedbacks = await prisma.feedback.findMany({
            where: {
                assignment: {
                    trainingId,
                },
            },
            include: {
                submitter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: true,
                    },
                },
                assignment: {
                    include: {
                        training: {
                            select: {
                                topicName: true,
                                mode: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
        })

        // Parse JSON comments and calculate aggregates
        const parsedFeedbacks = feedbacks.map(fb => {
            let detailedData = null
            try {
                detailedData = JSON.parse(fb.comments || '{}')
            } catch {
                detailedData = {}
            }

            return {
                ...fb,
                detailedFeedback: detailedData,
            }
        })

        // Calculate aggregates
        const totalResponses = parsedFeedbacks.length
        const avgTrainerRating = totalResponses > 0
            ? parsedFeedbacks.reduce((sum: number, fb: { trainerRating: number | null }) => sum + (fb.trainerRating || 0), 0) / totalResponses
            : 0
        const avgContentRating = totalResponses > 0
            ? parsedFeedbacks.reduce((sum: number, fb: { contentRating: number | null }) => sum + (fb.contentRating || 0), 0) / totalResponses
            : 0
        const avgLogisticsRating = totalResponses > 0
            ? parsedFeedbacks.reduce((sum: number, fb: { logisticsRating: number | null }) => sum + (fb.logisticsRating || 0), 0) / totalResponses
            : 0
        const avgOverallRating = totalResponses > 0
            ? parsedFeedbacks.reduce((sum: number, fb: { overallRating: number | null }) => sum + (fb.overallRating || 0), 0) / totalResponses
            : 0

        // Quality rating distribution
        const qualityDistribution = {
            Excellent: 0,
            Good: 0,
            Average: 0,
            'Below Average': 0,
        }

        parsedFeedbacks.forEach(fb => {
            const quality = fb.detailedFeedback?.qualityRating
            if (quality && quality in qualityDistribution) {
                qualityDistribution[quality as keyof typeof qualityDistribution]++
            }
        })

        return {
            feedbacks: parsedFeedbacks,
            aggregates: {
                totalResponses,
                avgTrainerRating: Math.round(avgTrainerRating * 10) / 10,
                avgContentRating: Math.round(avgContentRating * 10) / 10,
                avgLogisticsRating: Math.round(avgLogisticsRating * 10) / 10,
                avgOverallRating: Math.round(avgOverallRating * 10) / 10,
                qualityDistribution,
            },
        }
    } catch (error: any) {
        console.error('Get training feedback error:', error)
        throw new Error('Failed to fetch training feedback')
    }
}

// ============================================================================
// GET FEEDBACK SUMMARY (ANALYTICS)
// ============================================================================

export async function getFeedbackSummary(filters?: FeedbackFilterInput) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // Check permissions
    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'TRAINER', 'MANAGER'].includes(role)
    )
    if (!hasPermission) throw new Error('Insufficient permissions')

    try {
        // Build where clause
        const where: any = {}

        if (filters) {
            if (filters.dateFrom || filters.dateTo) {
                where.submittedAt = {}
                if (filters.dateFrom) where.submittedAt.gte = filters.dateFrom
                if (filters.dateTo) where.submittedAt.lte = filters.dateTo
            }

            if (filters.department) {
                where.submitter = {
                    department: filters.department,
                }
            }

            if (filters.trainingMode) {
                where.assignment = {
                    training: {
                        mode: filters.trainingMode,
                    },
                }
            }

            if (filters.ratingMin || filters.ratingMax) {
                where.overallRating = {}
                if (filters.ratingMin) where.overallRating.gte = filters.ratingMin
                if (filters.ratingMax) where.overallRating.lte = filters.ratingMax
            }
        }

        const feedbacks = await prisma.feedback.findMany({
            where,
            include: {
                submitter: {
                    select: {
                        name: true,
                        department: true,
                    },
                },
                assignment: {
                    include: {
                        training: {
                            select: {
                                topicName: true,
                                mode: true,
                            },
                        },
                        trainer: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
        })

        const totalResponses = feedbacks.length

        if (totalResponses === 0) {
            return {
                summary: {
                    totalResponses: 0,
                    avgRatings: {
                        trainer: 0,
                        content: 0,
                        logistics: 0,
                        overall: 0,
                    },
                    npsScore: 0,
                    responseRate: 0,
                },
                trends: [],
                trainerRankings: [],
                feedbacks: [],
            }
        }

        // Calculate averages
        const avgRatings = {
            trainer: feedbacks.reduce((sum: number, fb: { trainerRating: number | null }) => sum + (fb.trainerRating || 0), 0) / totalResponses,
            content: feedbacks.reduce((sum: number, fb: { contentRating: number | null }) => sum + (fb.contentRating || 0), 0) / totalResponses,
            logistics: feedbacks.reduce((sum: number, fb: { logisticsRating: number | null }) => sum + (fb.logisticsRating || 0), 0) / totalResponses,
            overall: feedbacks.reduce((sum: number, fb: { overallRating: number | null }) => sum + (fb.overallRating || 0), 0) / totalResponses,
        }

        // Calculate NPS (Net Promoter Score)
        // Promoters (5): +1, Passives (4): 0, Detractors (1-3): -1
        const promoters = feedbacks.filter(fb => (fb.overallRating || 0) === 5).length
        const detractors = feedbacks.filter(fb => (fb.overallRating || 0) <= 3).length
        const npsScore = ((promoters - detractors) / totalResponses) * 100

        // Get total completed trainings for response rate
        const totalCompleted = await prisma.trainingAssignment.count({
            where: {
                status: 'COMPLETED',
            },
        })
        const responseRate = totalCompleted > 0 ? (totalResponses / totalCompleted) * 100 : 0

        // Trainer rankings
        const trainerStats = new Map<string, { name: string; ratings: number[]; count: number }>()
        feedbacks.forEach(fb => {
            if (fb.assignment.trainer) {
                const trainerId = fb.assignment.trainer.name
                if (!trainerStats.has(trainerId)) {
                    trainerStats.set(trainerId, { name: trainerId, ratings: [], count: 0 })
                }
                const stats = trainerStats.get(trainerId)!
                stats.ratings.push(fb.trainerRating || 0)
                stats.count++
            }
        })

        const trainerRankings = Array.from(trainerStats.values())
            .map(stat => ({
                name: stat.name,
                avgRating: stat.ratings.reduce((a: number, b: number) => a + b, 0) / stat.count,
                totalFeedbacks: stat.count,
            }))
            .sort((a, b) => b.avgRating - a.avgRating)

        // Parse detailed feedback
        const parsedFeedbacks = feedbacks.map(fb => {
            let detailedData = null
            try {
                detailedData = JSON.parse(fb.comments || '{}')
            } catch {
                detailedData = {}
            }

            return {
                ...fb,
                detailedFeedback: detailedData,
            }
        })

        return {
            summary: {
                totalResponses,
                avgRatings: {
                    trainer: Math.round(avgRatings.trainer * 10) / 10,
                    content: Math.round(avgRatings.content * 10) / 10,
                    logistics: Math.round(avgRatings.logistics * 10) / 10,
                    overall: Math.round(avgRatings.overall * 10) / 10,
                },
                npsScore: Math.round(npsScore),
                responseRate: Math.round(responseRate),
            },
            trainerRankings,
            feedbacks: parsedFeedbacks,
        }
    } catch (error: any) {
        console.error('Get feedback summary error:', error)
        throw new Error('Failed to fetch feedback summary')
    }
}

// ============================================================================
// EXPORT FEEDBACK REPORT
// ============================================================================

export async function exportFeedbackReport(filters?: FeedbackFilterInput) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // Check permissions
    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'TRAINER', 'MANAGER'].includes(role)
    )
    if (!hasPermission) throw new Error('Insufficient permissions')

    try {
        const summary = await getFeedbackSummary(filters)

        // Generate CSV data
        const headers = [
            'Date',
            'Learner',
            'Department',
            'Training',
            'Mode',
            'Trainer',
            'Trainer Rating',
            'Content Rating',
            'Logistics Rating',
            'Overall Rating',
            'Quality',
            'What did you like most?',
            'Key Learnings',
            'Confusing Topics',
            'Competent & Confident?',
            'Suggestions',
        ]

        const rows = summary.feedbacks.map(fb => {
            const detailed = fb.detailedFeedback || {}
            return [
                new Date(fb.submittedAt).toLocaleDateString(),
                fb.submitter.name,
                fb.submitter.department || 'N/A',
                fb.assignment.training.topicName,
                fb.assignment.training.mode,
                fb.assignment.trainer?.name || 'N/A',
                fb.trainerRating || 'N/A',
                fb.contentRating || 'N/A',
                fb.logisticsRating || 'N/A',
                fb.overallRating || 'N/A',
                detailed.qualityRating || 'N/A',
                (detailed.likeMost || '').replace(/,/g, ';'),
                (detailed.keyLearnings || '').replace(/,/g, ';'),
                (detailed.confusingTopics || '').replace(/,/g, ';'),
                (detailed.competentConfident || '').replace(/,/g, ';'),
                (detailed.suggestions || '').replace(/,/g, ';'),
            ]
        })

        // Convert to CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n')

        return {
            success: true,
            csv: csvContent,
            filename: `feedback-report-${new Date().toISOString().split('T')[0]}.csv`,
        }
    } catch (error: any) {
        console.error('Export feedback report error:', error)
        throw new Error('Failed to export feedback report')
    }
}

// ============================================================================
// TRAINING EFFECTIVENESS DATA
// ============================================================================

export async function getTrainingEffectiveness(filters?: { skillId?: string; trainingId?: string }) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // Check permissions
    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'TRAINER', 'MANAGER'].includes(role)
    )
    if (!hasPermission) throw new Error('Insufficient permissions')

    try {
        // Build where clause for pre-assessments
        const whereClause: any = {
            isPreAssessment: true,
            status: 'PUBLISHED',
        }

        if (filters?.skillId) {
            whereClause.skillId = filters.skillId
        }

        if (filters?.trainingId) {
            whereClause.trainingId = filters.trainingId
        }

        // Get all pre-assessments
        const preAssessments = await prisma.assessment.findMany({
            where: whereClause,
            include: {
                skill: true,
            },
        })

        const effectivenessData = []

        for (const preAssessment of preAssessments) {
            // Find corresponding post-assessment
            const postAssessment = await prisma.assessment.findFirst({
                where: {
                    skillId: preAssessment.skillId,
                    trainingId: preAssessment.trainingId,
                    isPreAssessment: false,
                    status: 'PUBLISHED',
                },
            })

            if (!postAssessment) continue

            // Get all completed attempts for both assessments
            const preAttempts = await prisma.assessmentAttempt.findMany({
                where: {
                    assessmentId: preAssessment.id,
                    status: 'completed',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            department: true,
                        },
                    },
                },
            })

            const postAttempts = await prisma.assessmentAttempt.findMany({
                where: {
                    assessmentId: postAssessment.id,
                    status: 'completed',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            department: true,
                        },
                    },
                },
            })

            // Match pre and post attempts by user
            const userResults = []

            for (const preAttempt of preAttempts) {
                const postAttempt = postAttempts.find(pa => pa.userId === preAttempt.userId)

                if (postAttempt) {
                    const improvement = ((postAttempt.percentage || 0) - (preAttempt.percentage || 0))
                    const improvementPercent = ((improvement / (preAttempt.percentage || 1)) * 100)

                    userResults.push({
                        userId: preAttempt.userId,
                        userName: preAttempt.user.name,
                        department: preAttempt.user.department,
                        preScore: preAttempt.percentage || 0,
                        postScore: postAttempt.percentage || 0,
                        improvement: improvement,
                        improvementPercent: improvementPercent,
                        passed: (postAttempt.percentage || 0) >= postAssessment.passingScore,
                    })
                }
            }

            if (userResults.length > 0) {
                // Calculate statistics
                const avgImprovement = userResults.reduce((sum: number, r: { improvement: number }) => sum + r.improvement, 0) / userResults.length
                const avgPreScore = userResults.reduce((sum: number, r: { preScore: number }) => sum + r.preScore, 0) / userResults.length
                const avgPostScore = userResults.reduce((sum: number, r: { postScore: number }) => sum + r.postScore, 0) / userResults.length
                const passRate = (userResults.filter(r => r.passed).length / userResults.length) * 100

                // Distribution
                const improvementDistribution = {
                    negative: userResults.filter(r => r.improvement < 0).length,
                    low: userResults.filter(r => r.improvement >= 0 && r.improvement < 20).length,
                    medium: userResults.filter(r => r.improvement >= 20 && r.improvement < 50).length,
                    high: userResults.filter(r => r.improvement >= 50).length,
                }

                effectivenessData.push({
                    skillName: preAssessment.skill?.name || 'Unknown Skill',
                    skillId: preAssessment.skillId,
                    trainingId: preAssessment.trainingId,
                    totalLearners: userResults.length,
                    avgPreScore: Math.round(avgPreScore * 10) / 10,
                    avgPostScore: Math.round(avgPostScore * 10) / 10,
                    avgImprovement: Math.round(avgImprovement * 10) / 10,
                    passRate: Math.round(passRate),
                    improvementDistribution,
                    userResults: userResults.sort((a, b) => b.improvement - a.improvement),
                })
            }
        }

        return {
            success: true,
            data: effectivenessData,
        }
    } catch (error: any) {
        console.error('Get training effectiveness error:', error)
        throw new Error('Failed to fetch training effectiveness data')
    }
}

// ============================================================================
// GET TRAINING FEEDBACK DETAILS (Individual Training Analysis)
// ============================================================================

export async function getTrainingFeedbackDetails(trainingId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'TRAINER', 'MANAGER'].includes(role)
    )
    if (!hasPermission) throw new Error('Insufficient permissions')

    try {
        // Get training info
        const training = await prisma.training.findUnique({
            where: { id: trainingId },
            include: {
                skill: {
                    include: { category: true },
                },
            },
        })

        if (!training) throw new Error('Training not found')

        // Get all completed assignments for this training
        const completedAssignments = await prisma.trainingAssignment.findMany({
            where: {
                trainingId,
                status: 'COMPLETED',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: true,
                    },
                },
                feedback: true,
            },
            orderBy: {
                completionDate: 'desc',
            },
        })

        // Separate those with and without feedback
        const withFeedback = completedAssignments.filter(a => a.feedback && a.feedback.length > 0)
        const withoutFeedback = completedAssignments.filter(a => !a.feedback || a.feedback.length === 0)

        // Calculate statistics
        const totalCompleted = completedAssignments.length
        const feedbackCount = withFeedback.length
        const feedbackRate = totalCompleted > 0 ? (feedbackCount / totalCompleted) * 100 : 0

        // Parse detailed feedback from JSON comments
        const detailedFeedbacks = withFeedback.map(assignment => {
            let detailedData = null
            const feedbackItem = assignment.feedback?.[0] // Get first feedback
            try {
                if (feedbackItem?.comments) {
                    detailedData = JSON.parse(feedbackItem.comments)
                }
            } catch (e) {
                console.error('Failed to parse feedback JSON:', e)
            }

            return {
                id: feedbackItem?.id,
                assignmentId: assignment.id,
                user: assignment.user,
                submittedAt: feedbackItem?.submittedAt,
                ratings: {
                    trainer: feedbackItem?.trainerRating,
                    content: feedbackItem?.contentRating,
                    logistics: feedbackItem?.logisticsRating,
                    overall: feedbackItem?.overallRating,
                },
                detailedFeedback: detailedData,
            }
        })

        // Calculate average ratings
        const avgRatings = {
            trainer: feedbackCount > 0
                ? Math.round((withFeedback.reduce((sum: number, a: { feedback?: Array<{ trainerRating: number | null }> }) => sum + (a.feedback?.[0]?.trainerRating || 0), 0) / feedbackCount) * 10) / 10
                : 0,
            content: feedbackCount > 0
                ? Math.round((withFeedback.reduce((sum: number, a: { feedback?: Array<{ contentRating: number | null }> }) => sum + (a.feedback?.[0]?.contentRating || 0), 0) / feedbackCount) * 10) / 10
                : 0,
            logistics: feedbackCount > 0
                ? Math.round((withFeedback.reduce((sum: number, a: { feedback?: Array<{ logisticsRating: number | null }> }) => sum + (a.feedback?.[0]?.logisticsRating || 0), 0) / feedbackCount) * 10) / 10
                : 0,
            overall: feedbackCount > 0
                ? Math.round((withFeedback.reduce((sum: number, a: { feedback?: Array<{ overallRating: number | null }> }) => sum + (a.feedback?.[0]?.overallRating || 0), 0) / feedbackCount) * 10) / 10
                : 0,
        }

        return {
            success: true,
            data: {
                training,
                statistics: {
                    totalCompleted,
                    feedbackCount,
                    pendingCount: withoutFeedback.length,
                    feedbackRate: Math.round(feedbackRate),
                    avgRatings,
                },
                feedbacks: detailedFeedbacks,
                pendingUsers: withoutFeedback.map(a => ({
                    assignmentId: a.id,
                    user: a.user,
                    completedAt: a.completionDate,
                    daysSinceCompletion: a.completionDate 
                        ? Math.floor((Date.now() - new Date(a.completionDate).getTime()) / (1000 * 60 * 60 * 24))
                        : 0,
                })),
            },
        }
    } catch (error: any) {
        console.error('Get training feedback details error:', error)
        return {
            success: false,
            error: error.message || 'Failed to fetch training feedback details',
        }
    }
}

// ============================================================================
// SEND FEEDBACK REMINDERS (Bulk)
// ============================================================================

export async function sendFeedbackReminders(assignmentIds: string[]) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'MANAGER'].includes(role)
    )
    if (!hasPermission) throw new Error('Insufficient permissions')

    try {
        // Get assignments without feedback
        const assignments = await prisma.trainingAssignment.findMany({
            where: {
                id: { in: assignmentIds },
                status: 'COMPLETED',
                feedback: {
                    none: {}, // No feedback submitted
                },
            },
            include: {
                user: true,
                training: {
                    include: { skill: true },
                },
                trainer: true,
            },
        })

        if (assignments.length === 0) {
            return {
                success: false,
                error: 'No valid assignments found for reminders',
            }
        }

        const emailPromises = assignments.map(async (assignment) => {
            // Create notification
            await prisma.notification.create({
                data: {
                    recipientId: assignment.userId,
                    type: 'FEEDBACK_PENDING',
                    subject: 'Feedback Reminder',
                    message: `Please submit feedback for your completed training: ${assignment.training.topicName}`,
                },
            })

            // Send email
            await sendEmail({
                to: assignment.user.email,
                subject: `Feedback Reminder: ${assignment.training.topicName}`,
                template: 'feedback-reminder',
                data: {
                    userName: assignment.user.name,
                    trainingName: assignment.training.topicName,
                    skillName: assignment.training.skill?.name || 'N/A',
                    feedbackLink: `${process.env.NEXT_PUBLIC_APP_URL}/employee/training/${assignment.id}/feedback`,
                },
            })
        })

        await Promise.all(emailPromises)

        revalidatePath('/admin/reports/feedback')

        return {
            success: true,
            message: `Reminders sent to ${assignments.length} learner(s)`,
            count: assignments.length,
        }
    } catch (error: any) {
        console.error('Send feedback reminders error:', error)
        return {
            success: false,
            error: error.message || 'Failed to send reminders',
        }
    }
}

// ============================================================================
// GET ALL TRAININGS WITH FEEDBACK STATS
// ============================================================================

export async function getTrainingsWithFeedbackStats() {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const hasPermission = session.user.systemRoles?.some((role: string) =>
        ['ADMIN', 'TRAINER', 'MANAGER'].includes(role)
    )
    if (!hasPermission) throw new Error('Insufficient permissions')

    try {
        const trainings = await prisma.training.findMany({
            include: {
                skill: {
                    include: { category: true },
                },
                assignments: {
                    where: { status: 'COMPLETED' },
                    include: { feedback: true },
                },
                _count: {
                    select: {
                        assignments: {
                            where: { status: 'COMPLETED' },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        const trainingStats = trainings.map(training => {
            const completedCount = training._count.assignments
            const feedbackCount = training.assignments.filter(a => a.feedback).length
            const feedbackRate = completedCount > 0 ? (feedbackCount / completedCount) * 100 : 0

            return {
                id: training.id,
                topicName: training.topicName,
                mode: training.mode,
                skill: training.skill,
                completedCount,
                feedbackCount,
                pendingCount: completedCount - feedbackCount,
                feedbackRate: Math.round(feedbackRate),
            }
        })

        // Filter only trainings with completed assignments
        const trainingsWithCompletions = trainingStats.filter(t => t.completedCount > 0)

        return {
            success: true,
            data: trainingsWithCompletions,
        }
    } catch (error: any) {
        console.error('Get trainings with feedback stats error:', error)
        return {
            success: false,
            error: error.message || 'Failed to fetch training statistics',
        }
    }
}
