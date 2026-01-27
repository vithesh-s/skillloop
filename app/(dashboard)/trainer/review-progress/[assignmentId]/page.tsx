import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAssignmentProgress } from '@/actions/progress'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Award, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { ProgressTimeline } from '@/components/training/ProgressTimeline'
import { ProofReviewCard } from '@/components/training/ProofReviewCard'
import { MentorCommentForm } from '@/components/training/MentorCommentForm'

interface PageProps {
    params: Promise<{ assignmentId: string }>
}

export default async function ReviewAssignmentPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) return redirect('/login')

    const { assignmentId } = await params
    const result = await getAssignmentProgress(assignmentId)

    if (!result.success || !result.data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100 gap-4 p-6">
                <p className="text-lg text-muted-foreground">{result.error || 'Failed to load assignment'}</p>
                <Link href="/trainer/review-progress">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Reviews
                    </Button>
                </Link>
            </div>
        )
    }

    const { assignment, stats } = result.data

    const initials = assignment.user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <Link href="/trainer/review-progress">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Reviews
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Review Progress</h1>
                </div>
            </div>

            {/* Trainee & Training Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trainee Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Trainee Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-lg">{assignment.user.name}</p>
                                <p className="text-sm text-muted-foreground">{assignment.user.email}</p>
                                {assignment.user.department && (
                                    <p className="text-sm text-muted-foreground">{assignment.user.department}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Training Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Training Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="font-semibold">{assignment.training.topicName}</p>
                            {assignment.training.skill && (
                                <Badge 
                                    variant="secondary" 
                                    className={`mt-2 ${assignment.training.skill.category?.colorClass || ''}`}
                                >
                                    <Award className="h-3 w-3 mr-1" />
                                    {assignment.training.skill.name}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Started: {assignment.startDate ? format(new Date(assignment.startDate), 'PPP') : 'Not started'}</span>
                        </div>
                        <Badge variant={
                            assignment.status === 'COMPLETED' ? 'default' :
                            assignment.status === 'IN_PROGRESS' ? 'secondary' :
                            'outline'
                        }>
                            {assignment.status.replace('_', ' ')}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Stats Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Progress Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">{stats.totalWeeks}</p>
                            <p className="text-sm text-muted-foreground">Total Weeks</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{stats.averageCompletion}%</p>
                            <p className="text-sm text-muted-foreground">Avg Completion</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalTimeSpent}h</p>
                            <p className="text-sm text-muted-foreground">Time Spent</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.approvedProofs + stats.pendingProofs}</p>
                            <p className="text-sm text-muted-foreground">Proofs Submitted</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress Timeline with Mentor Comments */}
            <ProgressTimeline 
                progressUpdates={assignment.progressUpdates.map(update => ({
                    ...update,
                    _showCommentForm: true // Flag to show comment form
                }))}
                assignmentId={assignmentId}
            />

            {/* Pending Proofs for Review */}
            {assignment.proofs.filter(p => p.status === 'PENDING').length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Proofs for Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {assignment.proofs
                            .filter(p => p.status === 'PENDING')
                            .map(proof => (
                                <ProofReviewCard key={proof.id} proof={proof} />
                            ))}
                    </CardContent>
                </Card>
            )}

            {/* Approved/Rejected Proofs */}
            {assignment.proofs.filter(p => p.status !== 'PENDING').length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Reviewed Proofs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {assignment.proofs
                                .filter(p => p.status !== 'PENDING')
                                .map(proof => (
                                    <div key={proof.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{proof.fileName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(proof.uploadDate), 'PPP')}
                                            </p>
                                        </div>
                                        <Badge variant={proof.status === 'APPROVED' ? 'default' : 'destructive'}>
                                            {proof.status}
                                        </Badge>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
