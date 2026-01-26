'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrainingCompletionDialog } from './TrainingCompletionDialog'
import { format } from 'date-fns'
import { RiCalendarLine, RiTimeLine, RiCheckboxCircleLine, RiPlayCircleLine, RiCloseCircleLine } from '@remixicon/react'

interface MyTrainingsListProps {
    assignments: any[] // Simplified typing
}

export function MyTrainingsList({ assignments }: MyTrainingsListProps) {
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            ASSIGNED: { variant: 'secondary', icon: RiCalendarLine, label: 'Assigned' },
            IN_PROGRESS: { variant: 'default', icon: RiPlayCircleLine, label: 'In Progress' },
            COMPLETED: { variant: 'success', icon: RiCheckboxCircleLine, label: 'Completed' },
            CANCELLED: { variant: 'destructive', icon: RiCloseCircleLine, label: 'Cancelled' }
        }
        const config = variants[status] || variants.ASSIGNED
        const Icon = config.icon
        return (
            <Badge variant={config.variant as any} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    const handleMarkComplete = (assignment: any) => {
        setSelectedAssignment(assignment)
        setIsDialogOpen(true)
    }

    if (assignments.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="text-center space-y-2">
                        <p className="text-muted-foreground">No trainings assigned yet.</p>
                        <p className="text-sm text-muted-foreground">Check back later or contact your manager.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4">
                {assignments.map((assignment) => (
                    <Card key={assignment.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{assignment.training.topicName}</CardTitle>
                                    <CardDescription>
                                        {assignment.training.skill?.name} • {assignment.training.mode}
                                    </CardDescription>
                                </div>
                                {getStatusBadge(assignment.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {assignment.training.description && (
                                <p className="text-sm text-muted-foreground">{assignment.training.description}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
                                    <span>Start: {format(new Date(assignment.startDate), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RiTimeLine className="h-4 w-4 text-muted-foreground" />
                                    <span>Due: {format(new Date(assignment.targetCompletionDate), 'MMM dd, yyyy')}</span>
                                </div>
                                {assignment.training.duration && (
                                    <div className="flex items-center gap-2">
                                        <RiTimeLine className="h-4 w-4 text-muted-foreground" />
                                        <span>{assignment.training.duration} hours</span>
                                    </div>
                                )}
                            </div>

                            {assignment.trainer && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Trainer: </span>
                                    <span className="font-medium">{assignment.trainer.name}</span>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                {assignment.status === 'ASSIGNED' && (
                                    <>
                                        <Button size="sm" variant="outline">View Details</Button>
                                        <Button size="sm" onClick={() => handleMarkComplete(assignment)}>
                                            Start Training
                                        </Button>
                                    </>
                                )}
                                {assignment.status === 'IN_PROGRESS' && (
                                    <>
                                        <Button size="sm" variant="outline">View Progress</Button>
                                        <Button size="sm" onClick={() => handleMarkComplete(assignment)}>
                                            Mark Complete
                                        </Button>
                                    </>
                                )}
                                {assignment.status === 'COMPLETED' && (
                                    <>
                                        <Button size="sm" variant="outline">View Certificate</Button>
                                        <Button size="sm" variant="outline">View Details</Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedAssignment && (
                <TrainingCompletionDialog
                    assignment={selectedAssignment}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                />
            )}
        </>
    )
}
