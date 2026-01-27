'use client'

import { useState, useEffect } from 'react'
import { getTrainingsWithFeedbackStats, getTrainingFeedbackDetails, sendFeedbackReminders } from '@/actions/feedback'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
    Users, 
    CheckCircle2, 
    AlertCircle, 
    Send, 
    Eye, 
    TrendingUp,
    Star,
    MessageSquare,
    Calendar,
    Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'

export default function TrainingFeedbackPage() {
    const [loading, setLoading] = useState(true)
    const [trainings, setTrainings] = useState<any[]>([])
    const [selectedTraining, setSelectedTraining] = useState<string>('')
    const [trainingDetails, setTrainingDetails] = useState<any>(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [sendingReminders, setSendingReminders] = useState(false)
    const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; feedback: any }>({
        open: false,
        feedback: null,
    })

    useEffect(() => {
        loadTrainings()
    }, [])

    useEffect(() => {
        if (selectedTraining) {
            loadTrainingDetails(selectedTraining)
        }
    }, [selectedTraining])

    const loadTrainings = async () => {
        setLoading(true)
        try {
            const result = await getTrainingsWithFeedbackStats()
            if (result.success) {
                setTrainings(result.data || [])
            } else {
                toast.error('Failed to load trainings', {
                    description: result.error || 'Please try again',
                })
            }
        } catch (error: any) {
            toast.error('Failed to load trainings', {
                description: error.message || 'Please try again',
            })
        } finally {
            setLoading(false)
        }
    }

    const loadTrainingDetails = async (trainingId: string) => {
        setDetailsLoading(true)
        setSelectedUsers([])
        try {
            const result = await getTrainingFeedbackDetails(trainingId)
            if (result.success) {
                setTrainingDetails(result.data)
            } else {
                toast.error('Failed to load training details', {
                    description: result.error || 'Please try again',
                })
            }
        } catch (error: any) {
            toast.error('Failed to load training details', {
                description: error.message || 'Please try again',
            })
        } finally {
            setDetailsLoading(false)
        }
    }

    const handleSendReminders = async () => {
        if (selectedUsers.length === 0) {
            toast.error('No users selected', {
                description: 'Please select at least one user to send reminders',
            })
            return
        }

        setSendingReminders(true)
        try {
            const result = await sendFeedbackReminders(selectedUsers)
            if (result.success) {
                toast.success('Reminders sent successfully!', {
                    description: `Sent to ${result.count} learner(s)`,
                })
                setSelectedUsers([])
                // Reload details to update the list
                if (selectedTraining) {
                    loadTrainingDetails(selectedTraining)
                }
            } else {
                toast.error('Failed to send reminders', {
                    description: result.error || 'Please try again',
                })
            }
        } catch (error: any) {
            toast.error('Failed to send reminders', {
                description: error.message || 'Please try again',
            })
        } finally {
            setSendingReminders(false)
        }
    }

    const toggleUserSelection = (assignmentId: string) => {
        setSelectedUsers(prev =>
            prev.includes(assignmentId)
                ? prev.filter(id => id !== assignmentId)
                : [...prev, assignmentId]
        )
    }

    const toggleSelectAll = () => {
        if (!trainingDetails?.pendingUsers) return
        
        if (selectedUsers.length === trainingDetails.pendingUsers.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(trainingDetails.pendingUsers.map((u: any) => u.assignmentId))
        }
    }

    const viewFeedback = (feedback: any) => {
        setFeedbackDialog({ open: true, feedback })
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-600'
        if (rating >= 3) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getFeedbackRateColor = (rate: number) => {
        if (rate >= 80) return 'bg-green-100 text-green-800 border-green-300'
        if (rate >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
        return 'bg-red-100 text-red-800 border-red-300'
    }

    if (loading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading trainings...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Training Feedback Analysis</h1>
                    <p className="text-muted-foreground">
                        View feedback by individual training and send reminders
                    </p>
                </div>
                <Link href="/admin/reports/feedback">
                    <Button variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Overall Analytics
                    </Button>
                </Link>
            </div>

            {/* Training Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Select Training
                    </CardTitle>
                    <CardDescription>Choose a training to view detailed feedback analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedTraining} onValueChange={setSelectedTraining}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a training..." />
                        </SelectTrigger>
                        <SelectContent>
                            {trainings.map((training) => (
                                <SelectItem key={training.id} value={training.id}>
                                    <div className="flex items-center justify-between w-full gap-4">
                                        <span className="font-medium">{training.topicName}</span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline">{training.mode}</Badge>
                                            <span>
                                                {training.feedbackCount}/{training.completedCount} responses
                                            </span>
                                            <Badge className={getFeedbackRateColor(training.feedbackRate)}>
                                                {training.feedbackRate}%
                                            </Badge>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {trainings.length === 0 && (
                        <Alert className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                No trainings with completed assignments found
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Training Details */}
            {selectedTraining && trainingDetails && !detailsLoading && (
                <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {trainingDetails.statistics.totalCompleted}
                                </div>
                                <p className="text-xs text-muted-foreground">Learners who completed</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Feedback Received</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {trainingDetails.statistics.feedbackCount}
                                </div>
                                <Progress
                                    value={trainingDetails.statistics.feedbackRate}
                                    className="h-2 mt-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {trainingDetails.statistics.feedbackRate}% response rate
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">
                                    {trainingDetails.statistics.pendingCount}
                                </div>
                                <p className="text-xs text-muted-foreground">Awaiting responses</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                                <Star className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${getRatingColor(trainingDetails.statistics.avgRatings.overall)}`}>
                                    {trainingDetails.statistics.avgRatings.overall}/5
                                </div>
                                <p className="text-xs text-muted-foreground">Overall satisfaction</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Average Ratings Breakdown */}
                    {trainingDetails.statistics.feedbackCount > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Rating Breakdown</CardTitle>
                                <CardDescription>Average ratings across different dimensions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className={`text-3xl font-bold ${getRatingColor(trainingDetails.statistics.avgRatings.trainer)}`}>
                                            {trainingDetails.statistics.avgRatings.trainer}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Trainer</p>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-3xl font-bold ${getRatingColor(trainingDetails.statistics.avgRatings.content)}`}>
                                            {trainingDetails.statistics.avgRatings.content}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Content</p>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-3xl font-bold ${getRatingColor(trainingDetails.statistics.avgRatings.logistics)}`}>
                                            {trainingDetails.statistics.avgRatings.logistics}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Materials</p>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-3xl font-bold ${getRatingColor(trainingDetails.statistics.avgRatings.overall)}`}>
                                            {trainingDetails.statistics.avgRatings.overall}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Overall</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pending Feedback - Users Who Haven't Submitted */}
                    {trainingDetails.pendingUsers && trainingDetails.pendingUsers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-amber-600" />
                                            Pending Feedback
                                        </CardTitle>
                                        <CardDescription>
                                            {trainingDetails.pendingUsers.length} learner(s) haven't submitted feedback yet
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={handleSendReminders}
                                        disabled={selectedUsers.length === 0 || sendingReminders}
                                        className="gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        Send Reminders ({selectedUsers.length})
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedUsers.length === trainingDetails.pendingUsers.length}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead>Learner</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Completed On</TableHead>
                                            <TableHead>Days Since</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trainingDetails.pendingUsers.map((pending: any) => (
                                            <TableRow key={pending.assignmentId}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedUsers.includes(pending.assignmentId)}
                                                        onCheckedChange={() => toggleUserSelection(pending.assignmentId)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{pending.user.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {pending.user.email}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{pending.user.department || 'N/A'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {pending.completedAt ? (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(pending.completedAt), 'MMM dd, yyyy')}
                                                        </div>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            pending.daysSinceCompletion > 14
                                                                ? 'bg-red-100 text-red-800'
                                                                : pending.daysSinceCompletion > 7
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                        }
                                                    >
                                                        {pending.daysSinceCompletion} days
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Submitted Feedback - Individual Responses */}
                    {trainingDetails.feedbacks && trainingDetails.feedbacks.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-green-600" />
                                    Feedback Responses
                                </CardTitle>
                                <CardDescription>
                                    {trainingDetails.feedbacks.length} learner(s) have submitted feedback
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Learner</TableHead>
                                            <TableHead>Submitted On</TableHead>
                                            <TableHead>Overall Rating</TableHead>
                                            <TableHead>Trainer</TableHead>
                                            <TableHead>Content</TableHead>
                                            <TableHead>Materials</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trainingDetails.feedbacks.map((feedback: any) => (
                                            <TableRow key={feedback.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{feedback.user.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {feedback.user.email}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {format(new Date(feedback.submittedAt), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Star className={`h-4 w-4 ${getRatingColor(feedback.ratings.overall || 0)}`} />
                                                        <span className={`font-bold ${getRatingColor(feedback.ratings.overall || 0)}`}>
                                                            {feedback.ratings.overall}/5
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={getRatingColor(feedback.ratings.trainer || 0)}>
                                                        {feedback.ratings.trainer}/5
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={getRatingColor(feedback.ratings.content || 0)}>
                                                        {feedback.ratings.content}/5
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={getRatingColor(feedback.ratings.logistics || 0)}>
                                                        {feedback.ratings.logistics}/5
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => viewFeedback(feedback)}
                                                        className="gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {trainingDetails.feedbacks.length === 0 && trainingDetails.pendingUsers.length === 0 && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                No completed assignments found for this training
                            </AlertDescription>
                        </Alert>
                    )}
                </>
            )}

            {detailsLoading && (
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading training details...</div>
                </div>
            )}

            {/* Feedback Detail Dialog */}
            <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ open, feedback: null })}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detailed Feedback</DialogTitle>
                        <DialogDescription>
                            Feedback from {feedbackDialog.feedback?.user.name}
                        </DialogDescription>
                    </DialogHeader>
                    {feedbackDialog.feedback && (
                        <div className="space-y-6">
                            {/* Ratings Summary */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="pt-6 text-center">
                                        <div className={`text-2xl font-bold ${getRatingColor(feedbackDialog.feedback.ratings.overall)}`}>
                                            {feedbackDialog.feedback.ratings.overall}/5
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Overall</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6 text-center">
                                        <div className={`text-2xl font-bold ${getRatingColor(feedbackDialog.feedback.ratings.trainer)}`}>
                                            {feedbackDialog.feedback.ratings.trainer}/5
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Trainer</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6 text-center">
                                        <div className={`text-2xl font-bold ${getRatingColor(feedbackDialog.feedback.ratings.content)}`}>
                                            {feedbackDialog.feedback.ratings.content}/5
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Content</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6 text-center">
                                        <div className={`text-2xl font-bold ${getRatingColor(feedbackDialog.feedback.ratings.logistics)}`}>
                                            {feedbackDialog.feedback.ratings.logistics}/5
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Materials</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detailed Responses */}
                            {feedbackDialog.feedback.detailedFeedback && (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">What did you like most about this training?</h4>
                                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                            {feedbackDialog.feedback.detailedFeedback.likeMost || 'No response'}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">What were your key learnings?</h4>
                                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                            {feedbackDialog.feedback.detailedFeedback.keyLearnings || 'No response'}
                                        </p>
                                    </div>

                                    {feedbackDialog.feedback.detailedFeedback.confusingTopics && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Topics that were confusing or unclear</h4>
                                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                                {feedbackDialog.feedback.detailedFeedback.confusingTopics}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Materials Helpful</h4>
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star
                                                        key={i}
                                                        className={`h-5 w-5 ${i <= feedbackDialog.feedback.detailedFeedback.materialHelpful
                                                            ? 'fill-yellow-500 text-yellow-500'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Interactive & Engaging</h4>
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star
                                                        key={i}
                                                        className={`h-5 w-5 ${i <= feedbackDialog.feedback.detailedFeedback.interactiveEngaging
                                                            ? 'fill-yellow-500 text-yellow-500'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Trainer Answered Questions</h4>
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star
                                                        key={i}
                                                        className={`h-5 w-5 ${i <= feedbackDialog.feedback.detailedFeedback.trainerAnswered
                                                            ? 'fill-yellow-500 text-yellow-500'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Content Satisfaction</h4>
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star
                                                        key={i}
                                                        className={`h-5 w-5 ${i <= feedbackDialog.feedback.detailedFeedback.contentSatisfaction
                                                            ? 'fill-yellow-500 text-yellow-500'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Quality Rating</h4>
                                        <Badge className="text-sm">
                                            {feedbackDialog.feedback.detailedFeedback.qualityRating || 'N/A'}
                                        </Badge>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Do you feel more competent and confident in this skill?
                                        </h4>
                                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                            {feedbackDialog.feedback.detailedFeedback.competentConfident || 'No response'}
                                        </p>
                                    </div>

                                    {feedbackDialog.feedback.detailedFeedback.suggestions && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Suggestions for Improvement</h4>
                                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                                {feedbackDialog.feedback.detailedFeedback.suggestions}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
