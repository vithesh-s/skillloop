'use client'

import React, { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarEvent, CalendarAssignment, CalendarViewMode } from './types'
import { MonthView } from './MonthView'
import { GanttView } from './GanttView'
import { ListView } from './ListView'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List as ListIcon, BarChart2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateICS } from '@/lib/ics'
import { toast } from 'sonner'

interface TrainingCalendarProps {
    events: CalendarEvent[]
    assignments?: CalendarAssignment[]
    userRole: 'ADMIN' | 'MANAGER' | 'TRAINER' | 'LEARNER'
    detailsPath?: string // e.g., '/admin/calendar' or '/employee/calendar'
}

export function TrainingCalendar({ events, assignments, userRole, detailsPath = '/calendar' }: TrainingCalendarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Parse date from URL or default to now
    const dateParam = searchParams.get('date')
    const initialDate = dateParam ? new Date(dateParam) : new Date()
    const [currentDate, setCurrentDate] = useState<Date>(initialDate)

    const [viewMode, setViewMode] = useState<CalendarViewMode>('MONTH')

    // Update URL on date change
    const handleNavigate = (direction: 'PREV' | 'NEXT' | 'TODAY') => {
        let newDate = new Date(currentDate)
        if (direction === 'PREV') newDate = subMonths(newDate, 1)
        if (direction === 'NEXT') newDate = addMonths(newDate, 1)
        if (direction === 'TODAY') newDate = new Date()
        
        setCurrentDate(newDate)
        
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', newDate.toISOString())
        router.push(`?${params.toString()}`)
    }

    // Default view based on role? 
    // Plan said "Default to Gantt Chart for admins". 
    // We can set initial state based on role if no preference stored.
    useEffect(() => {
        if (userRole === 'ADMIN' || userRole === 'MANAGER') {
            setViewMode('GANTT')
        }
    }, [userRole])

    const handleExport = async () => {
        if (events.length === 0) {
            toast.error('No events to export')
            return
        }
        try {
            const icsData = await generateICS(events)
            if (!icsData) return
            
            const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'training-calendar.ics')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('Calendar exported successfully')
        } catch (error) {
            console.error('Export failed', error)
            toast.error('Failed to export calendar')
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] min-h-150 gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleNavigate('PREV')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleNavigate('NEXT')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold w-40 text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => handleNavigate('TODAY')}>
                        Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted rounded-md p-1">
                        <Button 
                            variant={viewMode === 'MONTH' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="h-8 px-2 lg:px-3" 
                            onClick={() => setViewMode('MONTH')}
                        >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Month
                        </Button>
                        <Button 
                            variant={viewMode === 'GANTT' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="h-8 px-2 lg:px-3" 
                            onClick={() => setViewMode('GANTT')}
                        >
                            <BarChart2 className="h-4 w-4 mr-2" />
                            Timeline
                        </Button>
                        <Button 
                            variant={viewMode === 'LIST' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="h-8 px-2 lg:px-3" 
                            onClick={() => setViewMode('LIST')}
                        >
                            <ListIcon className="h-4 w-4 mr-2" />
                            List
                        </Button>
                    </div>
                </div>
            </div>

            {/* View Content */}
            <div className="flex-1 overflow-hidden min-h-0">
                {viewMode === 'MONTH' && (
                    <MonthView 
                        events={events} 
                        currentDate={currentDate} 
                        onDateChange={setCurrentDate}
                        userRole={userRole}
                        onEventClick={(e) => console.log('Event click', e)}
                    />
                )}
                {viewMode === 'GANTT' && (
                    <GanttView 
                        events={events}
                        assignments={assignments}
                        currentDate={currentDate} 
                        onDateChange={setCurrentDate}
                        userRole={userRole}
                    />
                )}
                {viewMode === 'LIST' && (
                    <ListView 
                        events={events} 
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        userRole={userRole}
                        className="h-full overflow-auto"
                    />
                )}
            </div>
        </div>
    )
}
