import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { formatDate } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { markAttendance } from '@/actions/calendar'

export default async function EditCalendarEventPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) return redirect('/login')

    const { id } = await params

    const event = await prisma.trainingCalendar.findUnique({
        where: { id },
        include: {
            training: {
                include: {
                    skill: true,
                    assignments: {
                        include: { user: true }
                    }
                }
            },
            attendance: true
        }
    })

    if (!event) return notFound()

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Training Session Details</h1>
                <Button variant="outline" disabled>Edit Details</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Session Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold text-sm text-muted-foreground">Training Topic</p>
                            <p className="text-lg font-medium">{event.training.topicName}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-muted-foreground">Skill</p>
                            <p>{event.training.skill.name}</p>
                        </div>
                         <div>
                            <p className="font-semibold text-sm text-muted-foreground">Date & Time</p>
                            <p>{formatDate(event.trainingDate, 'PPP p')}</p>
                        </div>
                         <div>
                            <p className="font-semibold text-sm text-muted-foreground">Mode</p>
                            <Badge variant={event.training.mode === 'ONLINE' ? 'default' : 'secondary'}>
                                {event.training.mode}
                            </Badge>
                        </div>
                         <div>
                            <p className="font-semibold text-sm text-muted-foreground">Location / Link</p>
                            {event.training.mode === 'ONLINE' ? (
                                <p className="text-blue-600 truncate">{event.meetingLink || event.training.meetingLink || 'No link provided'}</p>
                            ) : (
                                <p>{event.venue || event.training.venue || 'TBD'}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle>Attendees ({event.training.assignments.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                            {event.training.assignments.map(assignment => {
                                const attendance = event.attendance.find(a => a.userId === assignment.userId)
                                return (
                                    <div key={assignment.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={assignment.user.avatar || undefined} />
                                                <AvatarFallback>{assignment.user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{assignment.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{assignment.user.employeeNo || assignment.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {attendance ? (
                                                <Badge className={
                                                    attendance.status === 'PRESENT' ? 'bg-green-600 hover:bg-green-700' : 
                                                    attendance.status === 'LATE' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'
                                                }>
                                                    {attendance.status}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Not marked</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
