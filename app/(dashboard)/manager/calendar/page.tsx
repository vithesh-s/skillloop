import React from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { getTrainingCalendarView, getCalendarStats } from '@/actions/calendar'
import { TrainingCalendar } from '@/components/training/calendar/TrainingCalendar'
import { CalendarStats } from '@/components/training/calendar/CalendarStats'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ManagerCalendarPage({ searchParams }: { searchParams: Promise<{ date?: string, view?: string }> }) {
    const session = await auth()
    if (!session?.user) return redirect('/login')

    const params = await searchParams
    const dateStr = params.date
    const currentDate = dateStr ? new Date(dateStr) : new Date()

    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)

    const [viewResult, statsResult] = await Promise.all([
        getTrainingCalendarView('MANAGER', { start, end }),
        getCalendarStats('MANAGER', session.user.id!)
    ])

    if (!viewResult.success || !viewResult.data) {
        return <div>Failed to load calendar data.</div>
    }

    const stats = statsResult.success && statsResult.data ? statsResult.data : { upcoming: 0, active: 0, completedMonth: 0, learners: 0 }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Team Training Calendar</h1>
                    <p className="text-muted-foreground">Monitor training schedules for your team.</p>
                </div>
            </div>

            <CalendarStats stats={stats} />

            <TrainingCalendar 
                events={viewResult.data.events as any} 
                assignments={viewResult.data.assignments as any} 
                userRole="MANAGER"
                detailsPath="/manager/calendar"
            />
        </div>
    )
}
