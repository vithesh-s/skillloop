import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getTrainingsForReview } from '@/actions/progress'
import { getPendingProofsForReview } from '@/actions/proofs'
import { MentorReviewDashboard } from '@/components/training/MentorReviewDashboard'
import { ProofReviewList } from '@/components/training/ProofReviewList'
import { AlertCircle } from 'lucide-react'

export default async function ReviewProgressPage() {
    const session = await auth()
    if (!session?.user) return redirect('/login')

    // Verify user is trainer/mentor/admin
    const roles = session.user.systemRoles || []
    if (!roles.some((r: string) => ['ADMIN', 'TRAINER', 'MENTOR'].includes(r))) {
        return redirect('/unauthorized')
    }

    // Fetch trainings requiring review
    const trainingsResult = await getTrainingsForReview()
    const proofsResult = await getPendingProofsForReview()

    const trainings = trainingsResult.success ? trainingsResult.data : []
    const proofs = proofsResult.success ? proofsResult.data : []

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Progress Reviews</h1>
                <p className="text-muted-foreground">
                    Review trainee progress updates and approve completion proofs
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardDescription>Active Trainings</CardDescription>
                        <CardTitle className="text-3xl">{trainings?.length || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Pending Proofs</CardDescription>
                        <CardTitle className="text-3xl">{proofs?.length || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Overdue Updates</CardDescription>
                        <CardTitle className="text-3xl text-red-600">
                            {trainings?.filter(t => t.isOverdue).length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="trainings" className="w-full">
                <TabsList className="grid w-full md:w-100 grid-cols-2">
                    <TabsTrigger value="trainings">
                        Active Trainings ({trainings?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="proofs">
                        Pending Reviews ({proofs?.length || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="trainings" className="mt-6">
                    {trainingsResult.success && trainings ? (
                        <MentorReviewDashboard trainings={trainings} />
                    ) : (
                        <Card className="p-6">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-5 w-5" />
                                <p>{trainingsResult.error || 'Failed to load trainings'}</p>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="proofs" className="mt-6">
                    {proofsResult.success && proofs ? (
                        <ProofReviewList proofs={proofs} />
                    ) : (
                        <Card className="p-6">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-5 w-5" />
                                <p>{proofsResult.error || 'Failed to load proofs'}</p>
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
