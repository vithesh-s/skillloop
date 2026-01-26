import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CreateTrainingForm } from '@/components/dashboard/training/CreateTrainingForm'

export default async function ManagerCreateTrainingPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')
    
    const isManager = session.user.systemRoles?.includes('MANAGER')
    const isAdmin = session.user.systemRoles?.includes('ADMIN')
    const isTrainer = session.user.systemRoles?.includes('TRAINER')
    if (!isManager && !isAdmin && !isTrainer) redirect('/unauthorized')
    
    // Fetch skills for dropdown
    const skills = await prisma.skill.findMany({
        include: { category: true },
        orderBy: { name: 'asc' }
    })
    
    // Fetch trainers for offline training selection
    const trainers = await prisma.user.findMany({
        where: { systemRoles: { has: 'TRAINER' } },
        select: { id: true, name: true, email: true }
    })
    
    return <CreateTrainingForm skills={skills} trainers={trainers} />
}
