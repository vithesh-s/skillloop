'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrainingCompletionDialog } from './TrainingCompletionDialog'
import { format } from 'date-fns'
import { RiCalendarLine, RiTimeLine, RiCheckboxCircleLine, RiPlayCircleLine, RiCloseCircleLine, RiFileUploadLine, RiMessageLine, RiStarLine } from '@remixicon/react'

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
                {assignments.map((assignment) => {
                    const isOnline = assignment.training.mode === 'ONLINE'
                    const progressData = assignment.progressUpdates?.[0] // Latest progress (already sorted by weekNumber desc)
                    const hasProgress = progressData && progressData.completionPercentage > 0
                    const canSubmitProof = hasProgress && progressData.completionPercentage >= 80
                    const latestComment = progressData?.mentorComments // It's a string, not an array
                    const totalWeeks = assignment.training.duration ? Math.ceil(assignment.training.duration / 7) : 8
                    const completedWeeks = assignment.progressUpdates?.length || 0
                    const hasApprovedProof = assignment.proofs?.some((p: any) => p.status === 'APPROVED')
                    
                    return (
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
                                
                                {/* Progress indicator for online trainings */}
                                {isOnline && assignment.status === 'IN_PROGRESS' && hasProgress && (
                                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">Progress</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">
                                                    {completedWeeks}/{totalWeeks} weeks • {progressData.completionPercentage}%
                                                </span>
                                                {hasApprovedProof && (
                                                    <Badge variant="success" className="text-xs">Proof Approved</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Progress value={progressData.completionPercentage} className="h-2" />
                                        {latestComment && (
                                            <div className="flex items-start gap-2 text-sm pt-2 border-t">
                                                <RiMessageLine className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">Latest mentor comment:</p>
                                                    <p className="text-xs italic">&quot;{latestComment}&quot;</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                            {isOnline ? (
                                                <Link href={`/employee/training/${assignment.id}/progress`}>
                                                    <Button size="sm">Start Training</Button>
                                                </Link>
                                            ) : (
                                                <Button size="sm" onClick={() => handleMarkComplete(assignment)}>
                                                    Start Training
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    {assignment.status === 'IN_PROGRESS' && (
                                        <>
                                            {isOnline ? (
                                                <>
                                                    <Link href={`/employee/training/${assignment.id}/progress`}>
                                                        <Button size="sm">View Progress</Button>
                                                    </Link>
                                                    {canSubmitProof && !hasApprovedProof && (
                                                        <Link href={`/employee/training/${assignment.id}/progress#proof-upload`}>
                                                            <Button size="sm" variant="outline" className="gap-2">
                                                                <RiFileUploadLine className="h-4 w-4" />
                                                                Submit Proof
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <Button size="sm" variant="outline">View Progress</Button>
                                                    <Button size="sm" onClick={() => handleMarkComplete(assignment)}>
                                                        Mark Complete
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    )}
                                    {assignment.status === 'COMPLETED' && (
                                        <>
                                            <Link href={`/employee/training/${assignment.id}/feedback`}>
                                                <Button size="sm" className="gap-2">
                                                    <RiStarLine className="h-4 w-4" />
                                                    Give Feedback
                                                </Button>
                                            </Link>
                                            <Button size="sm" variant="outline">View Certificate</Button>
                                            {isOnline && (
                                                <Link href={`/employee/training/${assignment.id}/progress`}>
                                                    <Button size="sm" variant="outline">View History</Button>
                                                </Link>
                                            )}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
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
