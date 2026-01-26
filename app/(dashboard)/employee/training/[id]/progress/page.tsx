import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAssignmentProgress } from '@/actions/progress'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Award, FileText, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { ProgressUpdateForm } from '@/components/training/ProgressUpdateForm'
import { ProgressTimeline } from '@/components/training/ProgressTimeline'
import { ProgressStats } from '@/components/training/ProgressStats'
import { ProofUpload } from '@/components/training/ProofUpload'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function TrainingProgressPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) return redirect('/login')

    const { id } = await params
    const result = await getAssignmentProgress(id)

    if (!result.success || !result.data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100 gap-4">
                <p className="text-lg text-muted-foreground">{result.error || 'Failed to load training progress'}</p>
                <Link href="/employee/my-trainings">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to My Trainings
                    </Button>
                </Link>
            </div>
        )
    }

    const { assignment, stats } = result.data

    // Check if user can upload proof (>80% completion)
    const canUploadProof = stats.averageCompletion >= 80

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link href="/employee/my-trainings">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">{assignment.training.topicName}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                        {assignment.training.skill && (
                            <Badge 
                                variant="secondary"
                                className={assignment.training.skill.category?.colorClass || ''}
                            >
                                <Award className="mr-1 h-3 w-3" />
                                {assignment.training.skill.name}
                            </Badge>
                        )}
                        <Badge variant={
                            assignment.status === 'COMPLETED' ? 'default' :
                            assignment.status === 'IN_PROGRESS' ? 'secondary' :
                            'outline'
                        }>
                            {assignment.status.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Training Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Training Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Start Date</p>
                                <p className="text-sm text-muted-foreground">
                                    {assignment.startDate ? format(new Date(assignment.startDate), 'PPP') : 'Not started'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Target Completion</p>
                                <p className="text-sm text-muted-foreground">
                                    {assignment.targetCompletionDate ? format(new Date(assignment.targetCompletionDate), 'PPP') : 'Not set'}
                                </p>
                            </div>
                        </div>
                        {assignment.completionDate && (
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium">Completed On</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(assignment.completionDate), 'PPP')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    {assignment.trainer && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium">Trainer: <span className="text-muted-foreground font-normal">{assignment.trainer.name}</span></p>
                            {assignment.mentor && (
                                <p className="text-sm font-medium">Mentor: <span className="text-muted-foreground font-normal">{assignment.mentor.name}</span></p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Progress Stats */}
            <ProgressStats stats={stats} />

            {/* Progress Update Form (only if not completed) */}
            {assignment.status !== 'COMPLETED' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Update Your Progress</CardTitle>
                        <CardDescription>
                            Share your weekly progress with your mentor
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProgressUpdateForm 
                            assignmentId={id}
                            currentWeek={stats.totalWeeks + 1}
                            previousProgress={assignment.progressUpdates[assignment.progressUpdates.length - 1]}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Progress Timeline */}
            <ProgressTimeline 
                progressUpdates={assignment.progressUpdates}
                assignmentId={id}
            />

            {/* Proof Upload Section */}
            {canUploadProof && assignment.status !== 'COMPLETED' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Submit Proof of Completion</CardTitle>
                        <CardDescription>
                            Upload certificates, completion documents, or screenshots as proof
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProofUpload 
                            assignmentId={id}
                            existingProofs={assignment.proofs}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Show proofs even if already completed */}
            {assignment.proofs.length > 0 && canUploadProof === false && assignment.status !== 'COMPLETED' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Proof of Completion</CardTitle>
                        <CardDescription>
                            Complete at least 80% progress to unlock proof upload
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Keep making progress!</p>
                                <p className="text-sm text-muted-foreground">
                                    Current progress: {stats.averageCompletion}% (Need 80% to upload proof)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
