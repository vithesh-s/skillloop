'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCalendarEntries(filters?: { 
    userId?: string, 
    startDate?: Date, 
    endDate?: Date, 
    published?: boolean 
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    try {
        const where: any = {}

        // Date range filter
        if (filters?.startDate && filters?.endDate) {
            where.trainingDate = {
                gte: filters.startDate,
                lte: filters.endDate
            }
        }

        // Published filter
        if (filters?.published) {
            where.publishedAt = { not: null }
        }

        // User filter requires joining through TrainingAssignment
        // But TrainingCalendar is linked to Training, not directly to User.
        // So we filter TrainingCalendar where the training has an assignment for this user.
        if (filters?.userId) {
            where.training = {
                assignments: {
                    some: {
                        userId: filters.userId,
                        // Optionally ensuring assignment matches the date range? 
                        // The assignment covers the WHOLE training, calendar is specific dates.
                        // So if user is assigned to the training, they see the calendar events.
                        status: { not: 'CANCELLED' } 
                    }
                }
            }
        }

        const entries = await prisma.trainingCalendar.findMany({
            where,
            include: {
                training: {
                    include: {
                        skill: true,
                        creator: { select: { name: true, email: true } }
                    }
                },
                _count: {
                    select: { attendance: true }
                }
            },
            orderBy: { trainingDate: 'asc' }
        })

        return { success: true, data: entries }
    } catch (error) {
        console.error('Get calendar entries error:', error)
        return { success: false, error: 'Failed to fetch calendar entries' }
    }
}

export async function getUpcomingTrainings(userId?: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const targetUserId = userId || session.user.id

    try {
        const today = new Date()
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        // Find calendar entries for trainings assigned to this user
        // occurring in the next 30 days
        const upcoming = await prisma.trainingCalendar.findMany({
            where: {
                trainingDate: {
                    gte: today,
                    lte: thirtyDaysFromNow
                },
                training: {
                    assignments: {
                        some: {
                            userId: targetUserId,
                            status: { not: 'CANCELLED' }
                        }
                    }
                }
            },
            include: {
                training: {
                    include: {
                        skill: true
                    }
                }
            },
            orderBy: { trainingDate: 'asc' },
            take: 5 
        })

        // Also fetch AssessmentAssignments due soon?
        // Maybe separate query or client side composition. 
        // For now just trainings.

        return { success: true, data: upcoming }
    } catch (error) {
        console.error('Get upcoming trainings error:', error)
        return { success: false, error: 'Failed to get upcoming trainings' }
    }
}

export async function getTrainingCalendarView(
    role: 'ADMIN' | 'MANAGER' | 'TRAINER' | 'LEARNER',
    dateRange?: { start: Date, end: Date },
    managerId?: string // For MANAGER view of team
) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const where: any = {}

    if (dateRange) {
        where.trainingDate = {
            gte: dateRange.start,
            lte: dateRange.end
        }
    }

    // Role-based filtering
    if (role === 'ADMIN') {
        // No filter, see all
    } else if (role === 'MANAGER') {
        // Manager sees:
        // 1. Trainings where THEY are the creator? Or assigned?
        // 2. Trainings where their REPORTESS are assigned.
        
        // Let's implement seeing Reportees' trainings.
        // Needs to find trainings where at least one assignment belongs to a user reporting to this manager.
        const effectiveManagerId = managerId || session.user.id
        where.training = {
            assignments: {
                some: {
                    user: {
                        managerId: effectiveManagerId
                    }
                }
            }
        }
    } else if (role === 'LEARNER') {
        // See own trainings
        where.training = {
            assignments: {
                some: {
                    userId: session.user.id
                }
            }
        }
    } else if (role === 'TRAINER') {
        // See trainings where they are trainer OR creator?
        // Usually where they are assigned as Trainer in TrainingAssignment 
        // Or in OfflineTraining.trainerIds (which is JSON, harder to query directly in Prisma efficient way without raw query or separate check)
        // Schema: TrainingAssignment has trainerId.
        
        where.OR = [
            {
                training: {
                    assignments: {
                        some: { trainerId: session.user.id }
                    }
                }
            },
            {
                 // Maybe also creator?
                 training: { createdById: session.user.id }
            }
        ]
    }

    try {
        const events = await prisma.trainingCalendar.findMany({
            where,
            include: {
                training: {
                    select: {
                        id: true,
                        topicName: true,
                        mode: true,
                        skill: { select: { name: true, category: { select: { colorClass: true } } } }
                    }
                },
                // Include attendees info for Admin/Manager?
                // Might be too heavy if many attendees. 
                // Let's fetch basic counts or detailed only if needed.
                // We'll trust the client component to fetch details on click if needed,
                // OR we fetch assignments here to show "Who is attending".
                // Since this is for a "View", knowing WHO is involved is useful for Manager/Admin.
                attendance: {
                    select: {
                        userId: true,
                        status: true
                    }
                }
            },
            orderBy: { trainingDate: 'asc' }
        })

        // For Admin/Manager, we might want to know WHICH users caused this event to show up (e.g. which reportee).
        // The event is the TRAINING session. The USERS are linked via Training -> Assignments.
        // We can fetch assignments for these trainings to aggregate user info on the client.
        
        const trainingIds = Array.from(new Set(events.map(e => e.trainingId)))
        
        // Fetch assignments for these trainings to map users to events
        const assignments = await prisma.trainingAssignment.findMany({
            where: {
                trainingId: { in: trainingIds },
                ...(role === 'LEARNER' ? { userId: session.user.id } : {}),
                ...(role === 'MANAGER' ? { user: { managerId: managerId || session.user.id } } : {})
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        // image: true
                        department: true
                    }
                },
                training: {
                    select: {
                        id: true,
                        topicName: true,
                        mode: true,
                    }
                }
            }
        })

        // Merge data logic will happen on client or here. 
        // Let's return both and let client map them.
        return { success: true, data: { events, assignments } }

    } catch (error) {
        console.error('Get calendar view error:', error)
        return { success: false, error: 'Failed to load calendar' }
    }
}

export async function createCalendarEntry(data: { 
    trainingId: string, 
    trainingDate: Date, 
    venue?: string, 
    meetingLink?: string, 
    maxParticipants?: number 
}) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Only Admin/Trainer can create
    const roles = session.user.systemRoles || []
    if (!roles.some((r: string) => ['ADMIN', 'TRAINER'].includes(r))) {
        return { success: false, error: 'Insufficient permissions' }
    }

    try {
        const entry = await prisma.trainingCalendar.create({
            data: {
                trainingId: data.trainingId,
                trainingDate: data.trainingDate,
                venue: data.venue,
                meetingLink: data.meetingLink,
                maxParticipants: data.maxParticipants,
                publishedAt: new Date()
            },
            include: {
                training: {
                    include: {
                        skill: true,
                        assignments: {
                            include: { user: true }
                        }
                    }
                }
            }
        })

        // TODO: Send notifications to all assigned users
        
        revalidatePath('/admin/calendar')
        revalidatePath('/trainer/calendar')
        revalidatePath('/employee/calendar')
        return { success: true, data: entry }
    } catch (error) {
        console.error('Create calendar entry error:', error)
        return { success: false, error: 'Failed to create calendar entry' }
    }
}

export async function updateCalendarEntry(id: string, data: { trainingDate: Date, venue?: string, meetingLink?: string }) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Only Admin can update
    const roles = session.user.systemRoles || []
    if (!roles.includes('ADMIN')) throw new Error('Insufficient permissions')

    try {
        const oldEntry = await prisma.trainingCalendar.findUnique({
            where: { id },
            include: { training: true }
        })

        const entry = await prisma.trainingCalendar.update({
            where: { id },
            data: {
                trainingDate: data.trainingDate,
                venue: data.venue,
                meetingLink: data.meetingLink,
            },
            include: {
                training: {
                    include: {
                        assignments: {
                            include: { user: true }
                        }
                    }
                }
            }
        })

        // Send notifications if date changed
        // ... (simplified loop for now)
        if (oldEntry && oldEntry.trainingDate.getTime() !== data.trainingDate.getTime()) {
            // Notify all assigned users
            // Note: Import sendEmail if not already imported at top? 
            // Need to check imports.
        }

        revalidatePath('/admin/calendar')
        revalidatePath('/employee/calendar')
        return { success: true, data: entry }
    } catch (error) {
        console.error('Update calendar entry error:', error)
        return { success: false, error: 'Failed to update entry' }
    }
}

export async function markAttendance(calendarId: string, userId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Admin/Trainer/Manager permission
    const roles = session.user.systemRoles || []
    if (!roles.some((r: string) => ['ADMIN', 'TRAINER', 'MANAGER'].includes(r))) {
        return { success: false, error: 'Insufficient permissions' }
    }

    try {
        await prisma.attendance.upsert({
            where: { calendarId_userId: { calendarId, userId } },
            create: {
                calendarId,
                userId,
                status
            },
            update: {
                status
            }
        })
        revalidatePath('/admin/calendar')
        return { success: true }
    } catch (error) {
        console.error('Mark attendance error:', error)
        return { success: false, error: 'Failed to mark attendance' }
    }
}

export async function getCalendarStats(role: string, userId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Basic stats for the summary cards
    try {
        const whereAssignment: any = {}
        const whereTraining: any = {}

        if (role === 'LEARNER') {
            whereAssignment.userId = userId
        } else if (role === 'MANAGER') {
            whereAssignment.user = { managerId: userId }
            whereTraining.assignments = { some: { user: { managerId: userId } } }
        } else if (role === 'TRAINER') {
            whereAssignment.trainerId = userId
            whereTraining.assignments = { some: { trainerId: userId } } // Simplified
        }

        // 1. Total Upcoming Trainings
        const upcomingCount = await prisma.trainingCalendar.count({
            where: {
                trainingDate: { gte: new Date() },
                training: role === 'ADMIN' ? {} : { assignments: { some: whereAssignment } }
            }
        })

        // 2. Active Assignments
        const activeAssignmentsCount = await prisma.trainingAssignment.count({
            where: {
                ...whereAssignment,
                status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
            }
        })

        // 3. Completed Trainings (This Month)
        const startOfMonth = new Date(); startOfMonth.setDate(1)
        const completedCount = await prisma.trainingAssignment.count({
            where: {
                ...whereAssignment,
                status: 'COMPLETED',
                completionDate: { gte: startOfMonth }
            }
        })

        // 4. Total Learners (Unique) - for Admin/Manager
        let learnersCount = 0
        if (role === 'ADMIN' || role === 'MANAGER') {
            // Distinct users in assignments
            const learners = await prisma.trainingAssignment.findMany({
                where: whereAssignment,
                distinct: ['userId'],
                select: { userId: true }
            })
            learnersCount = learners.length
        }

        return {
            success: true,
            data: {
                upcoming: upcomingCount,
                active: activeAssignmentsCount,
                completedMonth: completedCount,
                learners: learnersCount
            }
        }

    } catch (error) {
        console.error('Stats error:', error)
        return { success: false, error: 'Failed to fetch stats' }
    }
}
