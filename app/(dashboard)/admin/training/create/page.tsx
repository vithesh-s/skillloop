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
    
    // Fetch all active employees for assessment owner selection
    const trainers = await prisma.user.findMany({
        where: { 
            resigned: false
        },
        select: { id: true, name: true, email: true, department: true, systemRoles: true },
        orderBy: { name: 'asc' }
    })
    
    // Sort by roles: ADMIN first, then MANAGER, then MENTOR, then TRAINER, then LEARNER
    const roleOrder = { ADMIN: 1, MANAGER: 2, MENTOR: 3, TRAINER: 4, LEARNER: 5 }
    trainers.sort((a, b) => {
        const aTopRole = Math.min(...(a.systemRoles?.map(r => roleOrder[r] || 99) || [99]))
        const bTopRole = Math.min(...(b.systemRoles?.map(r => roleOrder[r] || 99) || [99]))
        if (aTopRole !== bTopRole) return aTopRole - bTopRole
        return a.name.localeCompare(b.name)
    })
    
    // Get all unique departments from all users (not just trainers)
    const allDepartments = await prisma.user.findMany({
        where: { 
            department: { not: null },
            resigned: false
        },
        select: { department: true },
        distinct: ['department']
    })
    
    const departments = allDepartments
        .map(u => u.department)
        .filter(Boolean)
        .sort() as string[]
    
    return <CreateTrainingForm skills={skills} trainers={trainers} departments={departments} userRole="admin" />
}
