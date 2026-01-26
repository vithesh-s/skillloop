import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AssessmentDutiesClient } from '@/components/dashboard/assessments/AssessmentDutiesClient'

export default async function AssessmentDutiesPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    // Fetch trainings where the user is the assessment owner and skills
    const [ownedTrainings, skills] = await Promise.all([
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
        })
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Assessment Duties</h1>
                <p className="text-muted-foreground">
                    Trainings where you are responsible for creating assessment questions
                </p>
            </div>

            <AssessmentDutiesClient ownedTrainings={ownedTrainings} skills={skills} />
        </div>
    )
}
