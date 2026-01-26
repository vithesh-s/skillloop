import { TrainingCalendar, Training, Skill, TrainingAssignment } from '@prisma/client'

export type CalendarEvent = TrainingCalendar & {
    training: Training & {
        skill: Skill & {
            category?: {
                colorClass: string
            }
        }
        creator?: {
            name: string | null
            email: string | null
        }
    }
    _count?: {
        attendance: number
    }
}

export type CalendarViewMode = 'MONTH' | 'GANTT' | 'LIST'

export type CalendarAssignment = TrainingAssignment & {
    user: {
        id: string
        name: string | null
        image?: string | null
    }
    training: Training & {
        topicName: string
        mode: string
    }
}

export interface CalendarProps {
    events: CalendarEvent[]
    assignments?: CalendarAssignment[] // Added for Gantt view
    currentDate: Date
    onDateChange: (date: Date) => void
    onEventClick?: (event: CalendarEvent) => void
    userRole: 'ADMIN' | 'MANAGER' | 'TRAINER' | 'LEARNER'
}
