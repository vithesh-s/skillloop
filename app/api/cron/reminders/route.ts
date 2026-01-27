import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * Daily cron job for automated reminders
 * Vercel Cron: https://vercel.com/docs/cron-jobs
 * 
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const today = new Date()
        const threeDaysFromNow = new Date(today)
        threeDaysFromNow.setDate(today.getDate() + 3)

        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)

        let assessmentReminders = 0
        let feedbackReminders = 0
        let progressReminders = 0

        // ============================================================================
        // 1. ASSESSMENT REMINDERS (3 days before due date)
        // ============================================================================

        const upcomingAssessments = await prisma.assessmentAssignment.findMany({
            where: {
                status: 'PENDING',
                dueDate: {
                    gte: today,
                    lte: threeDaysFromNow,
                },
            },
            include: {
                user: true,
                assessment: {
                    include: {
                        skill: true,
                    },
                },
            },
        })

        for (const assignment of upcomingAssessments) {
            // Check if reminder already sent today
            const existingNotification = await prisma.notification.findFirst({
                where: {
                    recipientId: assignment.userId,
                    type: 'ASSESSMENT_ASSIGNED',
                    message: {
                        contains: assignment.assessment.title,
                    },
                    sentDate: {
                        gte: today,
                    },
                },
            })

            if (!existingNotification) {
                // Create notification
                await prisma.notification.create({
                    data: {
                        recipientId: assignment.userId,
                        type: 'ASSESSMENT_ASSIGNED',
                        subject: 'Assessment Due Soon',
                        message: `Reminder: Your assessment "${assignment.assessment.title}" is due on ${assignment.dueDate?.toLocaleDateString()}. Please complete it soon.`,
                    },
                })

                // Send email
                await sendEmail({
                    to: assignment.user.email,
                    subject: 'Assessment Due Reminder',
                    template: 'assessment-due',
                    data: {
                        userName: assignment.user.name,
                        trainingName: assignment.assessment.title,
                        dueDate: assignment.dueDate?.toLocaleDateString() || 'soon',
                        skillName: assignment.assessment.skill?.name || 'skill',
                    },
                })

                assessmentReminders++
            }
        }

        // ============================================================================
        // 2. FEEDBACK REMINDERS (7 days after training completion, if not submitted)
        // ============================================================================

        const completedTrainings = await prisma.trainingAssignment.findMany({
            where: {
                status: 'COMPLETED',
                completionDate: {
                    gte: sevenDaysAgo,
                    lte: sevenDaysAgo,
                },
            },
            include: {
                user: true,
                training: true,
                feedback: true,
            },
        })

        for (const assignment of completedTrainings) {
            // Check if feedback already submitted
            if (!assignment.feedback || assignment.feedback.length === 0) {
                // Check if reminder already sent today
                const existingNotification = await prisma.notification.findFirst({
                    where: {
                        recipientId: assignment.userId,
                        type: 'FEEDBACK_PENDING',
                        message: {
                            contains: assignment.training.topicName,
                        },
                        sentDate: {
                            gte: today,
                        },
                    },
                })

                if (!existingNotification) {
                    // Create notification
                    await prisma.notification.create({
                        data: {
                            recipientId: assignment.userId,
                            type: 'FEEDBACK_PENDING',
                            subject: 'Training Feedback Requested',
                            message: `Please submit feedback for the training "${assignment.training.topicName}" you completed on ${assignment.completionDate?.toLocaleDateString()}. Your input helps us improve!`,
                        },
                    })

                    // Send email
                    await sendEmail({
                        to: assignment.user.email,
                        subject: 'Training Feedback Reminder',
                        template: 'feedback-reminder',
                        data: {
                            userName: assignment.user.name,
                            trainingName: assignment.training.topicName,
                            completionDate: assignment.completionDate?.toLocaleDateString() || 'recently',
                            feedbackUrl: `${process.env.NEXTAUTH_URL}/employee/training/${assignment.id}/feedback`,
                        },
                    })

                    feedbackReminders++
                }
            }
        }

        // ============================================================================
        // 3. PROGRESS REMINDERS (weekly updates overdue >7 days)
        // ============================================================================

        const ongoingTrainings = await prisma.trainingAssignment.findMany({
            where: {
                status: 'IN_PROGRESS',
            },
            include: {
                user: true,
                training: true,
                mentor: true,
                progressUpdates: {
                    orderBy: {
                        updateDate: 'desc',
                    },
                    take: 1,
                },
            },
        })

        for (const assignment of ongoingTrainings) {
            const lastUpdate = assignment.progressUpdates[0]
            const daysSinceLastUpdate = lastUpdate
                ? Math.floor((today.getTime() - new Date(lastUpdate.updateDate).getTime()) / (1000 * 60 * 60 * 24))
                : Math.floor((today.getTime() - assignment.startDate.getTime()) / (1000 * 60 * 60 * 24))

            // Send reminder if no update in last 7 days
            if (daysSinceLastUpdate >= 7) {
                // Check if reminder already sent today
                const existingNotification = await prisma.notification.findFirst({
                    where: {
                        recipientId: assignment.userId,
                        type: 'PROGRESS_DUE',
                        message: {
                            contains: assignment.training.topicName,
                        },
                        sentDate: {
                            gte: today,
                        },
                    },
                })

                if (!existingNotification) {
                    // Create notification
                    await prisma.notification.create({
                        data: {
                            recipientId: assignment.userId,
                            type: 'PROGRESS_DUE',
                            subject: 'Training Progress Update Due',
                            message: `Please submit a progress update for your ongoing training "${assignment.training.topicName}". Last update was ${daysSinceLastUpdate} days ago.`,
                        },
                    })

                    // Send email
                    await sendEmail({
                        to: assignment.user.email,
                        subject: 'Training Progress Reminder',
                        template: 'progress-reminder',
                        data: {
                            userName: assignment.user.name,
                            trainingName: assignment.training.topicName,
                            daysSinceUpdate: daysSinceLastUpdate,
                            mentorName: assignment.mentor?.name || 'your mentor',
                            progressUrl: `${process.env.NEXTAUTH_URL}/employee/training/${assignment.id}/progress`,
                        },
                    })

                    progressReminders++
                }
            }
        }

        // ============================================================================
        // RETURN SUMMARY
        // ============================================================================

        return NextResponse.json({
            success: true,
            timestamp: today.toISOString(),
            reminders: {
                assessments: assessmentReminders,
                feedback: feedbackReminders,
                progress: progressReminders,
                total: assessmentReminders + feedbackReminders + progressReminders,
            },
        })
    } catch (error: any) {
        console.error('Cron job error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to send reminders',
            },
            { status: 500 }
        )
    }
}

// Disable static optimization for cron routes
export const dynamic = 'force-dynamic'
