import { createEvents, DateArray, EventAttributes } from 'ics'
import { CalendarEvent } from '@/components/training/calendar/types'

export async function generateICS(events: CalendarEvent[]) {
    if (!events.length) return null

    const icsEvents: EventAttributes[] = events.map(event => {
        const date = new Date(event.trainingDate)
        const start: DateArray = [
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours() || 9, // Default to 9 AM if no time
            date.getMinutes()
        ]

        // Default duration 1 hour? Or Training duration?
        // Training.duration is usually total hours (e.g. 20 hours).
        // Calendar view assumes daily sessions. Let's assume 1 hour blocks if not specified.
        const duration = { hours: 1, minutes: 0 }

        return {
            start,
            duration,
            title: event.training.topicName, // 'description' is usually long text, title is summary
            description: `Mode: ${event.training.mode}. Skill: ${event.training.skill.name}.`,
            location: event.venue || event.meetingLink || event.training.venue || event.training.meetingLink || undefined,
            url: event.meetingLink || event.training.meetingLink || undefined,
            categories: ['Training', event.training.mode],
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: 'Skill Loop Training', email: 'noreply@skillloop.com' },
        }
    })

    return new Promise<string>((resolve, reject) => {
        createEvents(icsEvents, (error, value) => {
            if (error) {
                reject(error)
                return
            }
            resolve(value)
        })
    })
}
