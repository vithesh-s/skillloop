'use client'

import React, { useMemo } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, differenceInDays, isSameDay, isWithinInterval, max, min, addDays } from 'date-fns'
import { CalendarAssignment, CalendarProps } from './types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface GanttViewProps extends CalendarProps {
    className?: string
}

const DAY_WIDTH = 40
const HEADER_HEIGHT = 50
const ROW_HEIGHT = 60

export function GanttView({ assignments = [], currentDate, className }: GanttViewProps) {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    
    // Generate days for the timeline (with some buffer? no, just month for now)
    const timelineDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Optimized Grouping: Map<UserId, Assignment[]>
    const { users, userAssignmentsMap } = useMemo(() => {
        const uMap = new Map<string, { id: string, name: string | null, image?: string | null }>()
        const aMap = new Map<string, CalendarAssignment[]>()

        assignments.forEach(a => {
            if (!uMap.has(a.userId)) {
                uMap.set(a.userId, a.user)
            }
            if (!aMap.has(a.userId)) {
                aMap.set(a.userId, [])
            }
            aMap.get(a.userId)?.push(a)
        })

        return { 
            users: Array.from(uMap.values()),
            userAssignmentsMap: aMap
        }
    }, [assignments])

    // Helper to position bars
    const getBarPosition = (start: Date, end: Date) => {
        // Clamp to month view
        const effectiveStart = max([new Date(start), monthStart])
        const effectiveEnd = min([new Date(end), monthEnd])
        
        if (effectiveStart > effectiveEnd) return null

        const startDiff = differenceInDays(effectiveStart, monthStart)
        const duration = differenceInDays(effectiveEnd, effectiveStart) + 1

        return {
            left: startDiff * DAY_WIDTH,
            width: duration * DAY_WIDTH
        }
    }

    return (
        <div className={cn("flex flex-col h-full border rounded-lg bg-background overflow-hidden", className)}>
            <div className="flex h-full">
                {/* Left Sidebar: Users */}
                <div className="w-[200px] shrink-0 border-r bg-muted/10 z-10 flex flex-col shadow-sm">
                    <div className="h-[50px] border-b flex items-center px-4 font-semibold text-sm bg-muted/40 text-muted-foreground">
                        User / Resource
                    </div>
                    <ScrollArea className="flex-1">
                        {users.map(user => (
                            <div key={user.id} className="h-[60px] border-b flex items-center px-4 gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate">{user.name}</span>
                            </div>
                        ))}
                    </ScrollArea>
                </div>

                {/* Right Area: Timeline */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <ScrollArea className="h-full w-full">
                        <div style={{ width: timelineDays.length * DAY_WIDTH }}>
                            {/* Header: Days */}
                            <div className="h-[50px] border-b flex sticky top-0 bg-background z-20">
                                {timelineDays.map(day => (
                                    <div 
                                        key={day.toISOString()} 
                                        className="shrink-0 border-r flex flex-col items-center justify-center text-xs text-muted-foreground"
                                        style={{ width: DAY_WIDTH }}
                                    >
                                        <span className="font-bold">{format(day, 'd')}</span>
                                        <span className="opacity-70 text-[10px]">{format(day, 'EE')}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Grid & Bars */}
                            <div>
                                {users.map(user => {
                                    // Get pre-filtered assignments
                                    const userAssignments = userAssignmentsMap.get(user.id) || []

                                    return (
                                        <div key={user.id} className="h-[60px] border-b relative group hover:bg-muted/5 transition-colors">
                                            {/* Grid Lines */}
                                            <div className="absolute inset-0 flex pointer-events-none">
                                                {timelineDays.map(day => (
                                                    <div 
                                                        key={day.toISOString()} 
                                                        className="border-r h-full opacity-50 last:border-0"
                                                        style={{ width: DAY_WIDTH }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Bars */}
                                            {userAssignments.map(assignment => {
                                                // Safety check: ensure training data exists
                                                if (!assignment.training) return null
                                                
                                                const pos = getBarPosition(assignment.startDate, assignment.targetCompletionDate)
                                                if (!pos) return null

                                                return (
                                                    <TooltipProvider key={assignment.id}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={cn(
                                                                        "absolute top-1/2 -translate-y-1/2 h-8 rounded-md text-[10px] flex items-center px-2 cursor-pointer shadow-sm overflow-hidden whitespace-nowrap transition-all hover:brightness-110",
                                                                        assignment.training?.mode === 'ONLINE' 
                                                                            ? "bg-blue-500 text-white" 
                                                                            : "bg-orange-500 text-white"
                                                                    )}
                                                                    style={{
                                                                        left: pos.left + 2,
                                                                        width: pos.width - 4
                                                                    }}
                                                                >
                                                                    <span className="font-semibold truncate w-full">
                                                                        {assignment.training?.topicName || 'Training'}
                                                                    </span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="font-bold">{assignment.training?.topicName || 'Training'}</p>
                                                                <p className="text-xs">
                                                                    {format(new Date(assignment.startDate), 'MMM d')} - {format(new Date(assignment.targetCompletionDate), 'MMM d')}
                                                                </p>
                                                                {assignment.training?.mode && (
                                                                    <p className="text-xs opacity-80">{assignment.training.mode}</p>
                                                                )}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
