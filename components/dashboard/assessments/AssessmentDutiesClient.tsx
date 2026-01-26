"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RiFileChartLine, RiInformationLine } from '@remixicon/react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { CreateAssessmentForm } from '@/components/dashboard/assessments/CreateAssessmentForm'

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

interface AssessmentDutiesClientProps {
    ownedTrainings: Training[]
    skills: any[]
}

export function AssessmentDutiesClient({ ownedTrainings, skills }: AssessmentDutiesClientProps) {
    const [selectedTraining, setSelectedTraining] = useState<Training | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleManageAssessment = (training: Training) => {
        setSelectedTraining(training)
        setDialogOpen(true)
    }

    return (
        <>
            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <RiInformationLine className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <CardTitle className="text-lg text-blue-900">Your Role as Assessment Owner</CardTitle>
                            <CardDescription className="text-blue-700 mt-1">
                                As an assessment owner, you are responsible for:
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-blue-900">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Creating comprehensive assessment questions for the training topic</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Ensuring questions accurately evaluate the learning objectives</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Reviewing and updating assessment content as needed</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Trainings List */}
            {ownedTrainings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ownedTrainings.map((training) => {
                        const assignedNames = training.assignments.map(a => a.user.name || a.user.email).join(', ')
                        return (
                            <Card key={training.id} className="hover:shadow-md transition-shadow flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="bg-blue-50 text-xs">
                                            Assessment Owner
                                        </Badge>
                                        <Badge variant={training.mode === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                                            {training.mode}
                                        </Badge>
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
                                    </div>

                                    <Button 
                                        size="sm" 
                                        className="w-full mt-4"
                                        onClick={() => handleManageAssessment(training)}
                                    >
                                        <RiFileChartLine className="mr-2 h-4 w-4" />
                                        Manage Assessment
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

            {/* Assessment Creation Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Assessment for {selectedTraining?.topicName}</DialogTitle>
                        <DialogDescription>
                            Create a comprehensive assessment for this training topic
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTraining && (
                        <CreateAssessmentForm 
                            skills={skills}
                            basePath="/employee/assessment-duties"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
