import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AssignTrainingInterface } from '@/components/dashboard/training/AssignTrainingInterface'

export default async function AssignTrainingPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')
    
    const isManager = session.user.systemRoles?.includes('MANAGER')
    const isAdmin = session.user.systemRoles?.includes('ADMIN')
    if (!isManager && !isAdmin) redirect('/unauthorized')
    
    // Fetch reportees
    const reportees = isAdmin
        ? await prisma.user.findMany({ 
            where: { resigned: false },
            select: { 
                id: true, 
                name: true, 
                email: true, 
                department: true,
                designation: true,
                roleId: true,
                assignedRole: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            } 
          })
        : await prisma.user.findMany({ 
            where: { managerId: session.user.id, resigned: false },
            select: { 
                id: true, 
                name: true, 
                email: true, 
                department: true,
                designation: true,
                roleId: true,
                assignedRole: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            } 
          })
    
    // Fetch available trainings
    const trainings = await prisma.training.findMany({
        include: { skill: true },
        orderBy: { createdAt: 'desc' }
    })
    
    // Fetch all job roles for filtering
    const roles = await prisma.jobRole.findMany({
        select: {
            id: true,
            name: true,
            level: true
        },
        orderBy: { name: 'asc' }
    })
    
    return <AssignTrainingInterface reportees={reportees} trainings={trainings} roles={roles} />
}
