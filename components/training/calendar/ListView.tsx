'use client'

import React from 'react'
import { format } from 'date-fns'
import { CalendarEvent, CalendarProps } from './types'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Video, MapPin, ExternalLink } from 'lucide-react'

interface ListViewProps extends CalendarProps {
    className?: string
}

export function ListView({ events, onEventClick, className }: ListViewProps) {
    // Group events by trainingId
    const groupedEvents = React.useMemo(() => {
        const groups = new Map<string, { events: CalendarEvent[], minDate: Date, maxDate: Date }>()

        events.forEach(event => {
            if (!groups.has(event.trainingId)) {
                groups.set(event.trainingId, { 
                    events: [], 
                    minDate: new Date(event.trainingDate), 
                    maxDate: new Date(event.trainingDate) 
                })
            }
            const group = groups.get(event.trainingId)!
            group.events.push(event)
            const eventDate = new Date(event.trainingDate)
            if (eventDate < group.minDate) group.minDate = eventDate
            if (eventDate > group.maxDate) group.maxDate = eventDate
        })
        
        return Array.from(groups.values()).sort((a, b) => a.minDate.getTime() - b.minDate.getTime())
    }, [events])

    return (
        <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Training Topic</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Location / Link</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupedEvents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No scheduled events found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        groupedEvents.map(({ events: groupEvents, minDate, maxDate }) => {
                            const event = groupEvents[0]
                            const isMultiDay = minDate.getTime() !== maxDate.getTime()

                            return (
                                <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onEventClick?.(event)}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span>
                                                {format(minDate, 'MMM d, yyyy')}
                                                {isMultiDay && ` - ${format(maxDate, 'MMM d, yyyy')}`}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(minDate, 'h:mm a')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{event.training.topicName}</span>
                                            <span className="text-xs text-muted-foreground">{event.training.skill?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={event.training.mode === 'ONLINE' ? 'default' : 'secondary'} className={event.training.mode === 'ONLINE' ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700 text-white"}>
                                            {event.training.mode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm max-w-[200px] truncate">
                                            {event.training.mode === 'ONLINE' ? (
                                                <>
                                                    <Video className="w-4 h-4 text-muted-foreground" />
                                                    {event.meetingLink || event.training.meetingLink ? (
                                                        <a 
                                                            href={event.meetingLink || event.training.meetingLink || '#'} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Join Meeting <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    ) : <span className="text-muted-foreground italic">Link pending</span>}
                                                </>
                                            ) : (
                                                <>
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    <span className="truncate">{event.venue || event.training.venue || 'TBD'}</span>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="ghost">Details</Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
