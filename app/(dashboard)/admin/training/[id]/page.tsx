import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getTrainingById } from '@/actions/trainings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RiCalendarLine, RiTimeLine, RiMapPinLine, RiTeamLine, RiLinksLine } from '@remixicon/react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function TrainingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) redirect('/login')
    
    const { id } = await params
    const result = await getTrainingById(id)
    if (!result.success || !result.data) notFound()
    
    const training = result.data

    return (
        <div className="space-y-6 max-w-6xl mx-auto py-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{training.topicName}</h1>
                    <p className="text-muted-foreground">{training.skill?.name} • {training.skill?.category?.name}</p>
                </div>
                <Badge variant={training.mode === 'ONLINE' ? 'default' : 'secondary'} className="text-sm">
                    {training.mode}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duration</CardTitle>
                        <RiTimeLine className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{training.duration}h</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
                        <RiTeamLine className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{training.assignments?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Created By</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">{training.creator?.name}</div>
                        <div className="text-xs text-muted-foreground">{training.creator?.email}</div>
                    </CardContent>
                </Card>
            </div>

            {training.description && (
                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{training.description}</p>
                    </CardContent>
                </Card>
            )}

            {training.mode === 'ONLINE' && training.onlineTraining && (
                <Card>
                    <CardHeader>
                        <CardTitle>Online Resources</CardTitle>
                        <CardDescription>
                            Estimated Duration: {training.onlineTraining.estimatedDuration}h • 
                            Mentor {training.onlineTraining.mentorRequired ? 'Required' : 'Optional'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(training.onlineTraining.resourceLinks as any[])?.map((resource: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-3 border rounded-md">
                                    <RiLinksLine className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="font-medium">{resource.title}</div>
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                            {resource.url}
                                        </a>
                                    </div>
                                    <Badge variant="outline">{resource.type}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {training.mode === 'OFFLINE' && training.offlineTraining && (
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule & Venue</CardTitle>
                        <CardDescription>
                            <RiMapPinLine className="inline h-4 w-4 mr-1" />
                            {training.offlineTraining.venue}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(training.offlineTraining.schedule as any[])?.map((session: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-3 border rounded-md">
                                    <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">{session.sessionTitle || `Session ${idx + 1}`}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {session.date} • {session.startTime} - {session.endTime}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Assigned Users</CardTitle>
                    <CardDescription>Recent assignments for this training</CardDescription>
                </CardHeader>
                <CardContent>
                    {training.assignments && training.assignments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Target Completion</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Trainer</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {training.assignments.map((assignment: any) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{assignment.user?.name}</div>
                                                <div className="text-xs text-muted-foreground">{assignment.user?.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(assignment.startDate), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{format(new Date(assignment.targetCompletionDate), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>
                                            <Badge variant={assignment.status === 'COMPLETED' ? 'success' : 'secondary'}>
                                                {assignment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{assignment.trainer?.name || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No users assigned yet.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button variant="outline" asChild>
                    <Link href="/admin/training">Back to Trainings</Link>
                </Button>
            </div>
        </div>
    )
}
