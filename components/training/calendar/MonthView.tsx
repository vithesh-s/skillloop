'use client'

import React from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, format } from 'date-fns'
import { CalendarEvent, CalendarProps } from './types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MonthViewProps extends CalendarProps {
    className?: string
}

export function MonthView({ events, currentDate, onEventClick, className }: MonthViewProps) {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    })

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className={cn("flex flex-col h-full border rounded-lg overflow-hidden bg-background", className)}>
            {/* Header Days */}
            <div className="grid grid-cols-7 border-b bg-muted/40">
                {weekDays.map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 grid-rows-5 md:grid-rows-6 flex-1">
                {calendarDays.map((day, index) => {
                    const dayEvents = events.filter(e => isSameDay(new Date(e.trainingDate), day))
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const isDayToday = isToday(day)

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "min-h-[100px] p-2 border-b border-r relative flex flex-col gap-1 transition-colors",
                                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                isDayToday && "bg-accent/10"
                            )}
                        >
                            <span className={cn(
                                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                                isDayToday && "bg-primary text-primary-foreground",
                                !isDayToday && "text-foreground"
                            )}>
                                {format(day, 'd')}
                            </span>

                            <div className="flex flex-col gap-1 overflow-hidden">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <TooltipProvider key={event.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onEventClick?.(event)
                                                    }}
                                                    className={cn(
                                                        "text-xs truncate px-1.5 py-0.5 rounded-sm w-full text-left font-medium border",
                                                        event.training.mode === 'ONLINE' 
                                                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900" 
                                                            : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-900"
                                                    )}
                                                >
                                                    {event.training.topicName}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="text-xs">
                                                    <p className="font-semibold">{event.training.topicName}</p>
                                                    <p>{format(new Date(event.trainingDate), 'h:mm a')} • {event.training.mode}</p>
                                                    <p>{event.training.venue || event.training.meetingLink || 'No location'}</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                                {dayEvents.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground pl-1">
                                        + {dayEvents.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
