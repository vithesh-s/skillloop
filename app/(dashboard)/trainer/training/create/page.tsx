import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CreateTrainingForm } from '@/components/dashboard/training/CreateTrainingForm'

export default async function CreateTrainingPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')
    
    const isAdmin = session.user.systemRoles?.includes('ADMIN')
    const isTrainer = session.user.systemRoles?.includes('TRAINER')
    const isManager = session.user.systemRoles?.includes('MANAGER')
    if (!isAdmin && !isTrainer && !isManager) redirect('/unauthorized')
    
    // Fetch skills for dropdown
    const skills = await prisma.skill.findMany({
        include: { category: true },
        orderBy: { name: 'asc' }
    })
    
    // Fetch trainers for offline training selection
    const trainers = await prisma.user.findMany({
        where: { systemRoles: { has: 'TRAINER' } },
        select: { id: true, name: true, email: true, department: true, systemRoles: true }
    })
    
    return <CreateTrainingForm skills={skills} trainers={trainers} departments={[]} userRole="trainer" />
}
