import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTrainings } from '@/actions/trainings'
import { TrainingsTable } from '@/components/dashboard/training/TrainingsTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RiAddLine } from '@remixicon/react'

export default async function TrainingsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')
    
    const isAdmin = session.user.systemRoles?.includes('ADMIN')
    const isTrainer = session.user.systemRoles?.includes('TRAINER')
    const isManager = session.user.systemRoles?.includes('MANAGER')
    if (!isAdmin && !isTrainer && !isManager) redirect('/unauthorized')
    
    const result = await getTrainings()
    const trainings = result.success ? result.data : []
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Training Catalog</h1>
                    <p className="text-muted-foreground">Manage training programs and assignments.</p>
                </div>
                <Button asChild>
                    <Link href="/admin/training/create">
                        <RiAddLine className="mr-2 h-4 w-4" />
                        Create Training
                    </Link>
                </Button>
            </div>
            <TrainingsTable trainings={trainings || []} userRole="admin" />
        </div>
    )
}
