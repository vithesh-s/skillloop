import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { AssessmentDutiesClient } from '@/components/dashboard/assessments/AssessmentDutiesClient'

export default async function AssessmentDutiesPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    // Fetch trainings where the user is the assessment owner, skills, draft assessments, and all user's assessments
    const [ownedTrainings, skills, draftAssessments, allAssessments] = await Promise.all([
        prisma.training.findMany({
            where: {
                assessmentOwnerId: session.user.id
            },
            include: {
                skill: {
                    select: {
                        name: true,
                        category: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                assignments: {
                    select: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.skill.findMany({
            include: {
                category: true,
            },
            orderBy: { name: 'asc' }
        }),
        prisma.assessment.findMany({
            where: {
                createdById: session.user.id,
                status: 'DRAFT'
            },
            include: {
                skill: {
                    select: {
                        name: true,
                        category: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        }),
        prisma.assessment.findMany({
            where: {
                createdById: session.user.id
            },
            select: {
                id: true,
                title: true,
                status: true,
                skillId: true,
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        })
    ])

    // Map assessments to trainings by skillId
    const trainingAssessments = new Map()
    ownedTrainings.forEach(training => {
        const assessment = allAssessments.find(a => a.skillId === training.skillId)
        if (assessment) {
            trainingAssessments.set(training.id, assessment)
        }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Assessment Duties</h1>
                <p className="text-muted-foreground">
                    Trainings where you are responsible for creating assessment questions
                </p>
            </div>

            <AssessmentDutiesClient 
                ownedTrainings={ownedTrainings} 
                skills={skills} 
                draftAssessments={draftAssessments}
                trainingAssessments={Object.fromEntries(trainingAssessments)}
            />
        </div>
    )
}
