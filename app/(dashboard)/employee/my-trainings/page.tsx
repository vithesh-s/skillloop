import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserTrainings } from '@/actions/trainings'
import { MyTrainingsList } from '@/components/dashboard/training/MyTrainingsList'

export default async function MyTrainingsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')
    
    const result = await getUserTrainings()
    const assignments = result.success ? result.data : []
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Trainings</h1>
                <p className="text-muted-foreground">View and complete your assigned training programs.</p>
            </div>
            <MyTrainingsList assignments={assignments || []} />
        </div>
    )
}
