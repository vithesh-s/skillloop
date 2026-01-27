"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RiFileChartLine, RiInformationLine, RiDeleteBinLine } from '@remixicon/react'
import { deleteAssessment } from '@/actions/assessments'
import { toast } from 'sonner'

interface Training {
    id: string
    topicName: string
    mode: string
    skill: {
        name: string
        category: {
            name: string
        }
    } | null
    assignments: {
        user: {
            name: string | null
            email: string
        }
    }[]
}

interface DraftAssessment {
    id: string
    title: string
    description: string | null
    skill: {
        name: string
        category: {
            name: string
        }
    } | null
    _count: {
        questions: number
    }
    totalMarks: number
    passingScore: number
    duration: number
    updatedAt: Date
}

interface TrainingAssessment {
    id: string
    title: string
    status: string
    _count: {
        questions: number
    }
}

interface AssessmentDutiesClientProps {
    ownedTrainings: Training[]
    skills: any[]
    draftAssessments: DraftAssessment[]
    trainingAssessments: Record<string, TrainingAssessment>
}

export function AssessmentDutiesClient({ ownedTrainings, skills, draftAssessments, trainingAssessments }: AssessmentDutiesClientProps) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleManageAssessment = (trainingId: string, assessment?: TrainingAssessment) => {
        if (assessment) {
            if (assessment.status === 'DRAFT') {
                router.push(`/employee/assessment-duties/${assessment.id}/edit`)
            } else if (assessment.status === 'PUBLISHED') {
                toast.info('This assessment is already published')
                return
            }
        } else {
            router.push(`/employee/assessment-duties/create/${trainingId}`)
        }
    }

    const handleEditDraft = (assessmentId: string) => {
        router.push(`/employee/assessment-duties/${assessmentId}/edit`)
    }

    const handleDeleteDraft = async (assessmentId: string) => {
        if (!confirm('Are you sure you want to delete this draft assessment? This action cannot be undone.')) {
            return
        }

        setDeletingId(assessmentId)
        try {
            const result = await deleteAssessment(assessmentId)
            if (result.success) {
                toast.success('Draft assessment deleted successfully')
                router.refresh()
            } else {
                toast.error(result.message || 'Failed to delete assessment')
            }
        } catch (error) {
            toast.error('An error occurred while deleting the assessment')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <>
            {/* Draft Assessments Section */}
            {draftAssessments.length > 0 && (
                <div className="space-y-3">
                    <div>
                        <h2 className="text-lg font-semibold">Draft Assessments</h2>
                        <p className="text-sm text-muted-foreground">
                            Continue working on your saved drafts
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {draftAssessments.map((assessment) => (
                            <Card key={assessment.id} className="hover:shadow-lg transition-all flex flex-col border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50/80 to-white h-full">
                                <CardHeader className="pb-3 pt-5">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs font-semibold">
                                            DRAFT
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                            {assessment._count.questions} Q
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg leading-tight font-bold">{assessment.title}</CardTitle>
                                    {assessment.description && (
                                        <CardDescription className="text-xs line-clamp-1 mt-1">
                                            {assessment.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-between pt-2 pb-3">
                                    <div className="space-y-1.5 text-sm">
                                        <div>
                                            <span className="text-muted-foreground text-xs">Skill:</span>
                                            <p className="font-medium text-sm">{assessment.skill?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-xs">Category:</span>
                                            <p className="font-medium text-sm">{assessment.skill?.category?.name || 'N/A'}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <span className="text-muted-foreground">Marks:</span>
                                                <p className="font-medium">{assessment.totalMarks}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Pass:</span>
                                                <p className="font-medium">{assessment.passingScore}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Duration:</span>
                                                <p className="font-medium">{assessment.duration}m</p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-xs">Last Updated:</span>
                                            <p className="font-medium text-xs">
                                                {new Date(assessment.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="flex-1 border-yellow-300 hover:bg-yellow-100"
                                            onClick={() => handleEditDraft(assessment.id)}
                                            disabled={deletingId === assessment.id}
                                        >
                                            <RiFileChartLine className="mr-2 h-4 w-4" />
                                            Continue Editing
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteDraft(assessment.id)}
                                            disabled={deletingId === assessment.id}
                                        >
                                            <RiDeleteBinLine className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Trainings List */}
            <div className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold">Your Assessment Duties</h2>
                    <p className="text-sm text-muted-foreground">
                        Trainings where you need to create assessments
                    </p>
                </div>
            {ownedTrainings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ownedTrainings.map((training) => {
                        const assignedNames = training.assignments.map(a => a.user.name || a.user.email).join(', ')
                        const assessment = trainingAssessments[training.id]
                        const isDraft = assessment?.status === 'DRAFT'
                        const isPublished = assessment?.status === 'PUBLISHED'
                        
                        return (
                            <Card key={training.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <Badge variant="outline" className="bg-blue-50 text-xs">
                                            Assessment Owner
                                        </Badge>
                                        <Badge variant={training.mode === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                                            {training.mode}
                                        </Badge>
                                        {isDraft && (
                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                                Draft ({assessment._count.questions} Q)
                                            </Badge>
                                        )}
                                        {isPublished && (
                                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                                                Published
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-lg">{training.topicName}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-between">
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground text-xs">Skill:</span>
                                            <p className="font-medium">{training.skill?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-xs">Category:</span>
                                            <p className="font-medium">{training.skill?.category?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-xs">Assigned To:</span>
                                            <p className="font-medium text-xs line-clamp-2" title={assignedNames}>
                                                {assignedNames || 'No one assigned yet'}
                                            </p>
                                        </div>
                                        {assessment && (
                                            <div>
                                                <span className="text-muted-foreground text-xs">Assessment:</span>
                                                <p className="font-medium text-xs">{assessment.title}</p>
                                            </div>
                                        )}
                                    </div>

                                    <Button 
                                        size="sm" 
                                        className="w-full mt-4"
                                        variant={isPublished ? 'outline' : 'default'}
                                        onClick={() => handleManageAssessment(training.id, assessment)}
                                        disabled={isPublished}
                                    >
                                        <RiFileChartLine className="mr-2 h-4 w-4" />
                                        {isPublished ? 'Published' : isDraft ? 'Continue Draft' : 'Create Assessment'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <RiFileChartLine className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No Assessment Duties</p>
                            <p className="text-sm mt-2">
                                You haven't been assigned as an assessment owner for any trainings yet.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
            </div>

        </>
    )
}
