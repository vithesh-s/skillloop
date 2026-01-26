import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
    adapter,
})

async function ensureVithesh() {
    try {
        console.log('🔍 Checking for vitheshs@acemicromatic.com...')

        let user = await prisma.user.findUnique({
            where: { email: 'vitheshs@acemicromatic.com' },
            select: {
                id: true,
                name: true,
                email: true,
                systemRoles: true,
                employeeNo: true,
            },
        })

        if (user) {
            console.log('✅ User exists:')
            console.log(JSON.stringify(user, null, 2))
            console.log('\n📋 Copy this user ID for your session:', user.id)
        } else {
            console.log('❌ User not found. Creating...')

            user = await prisma.user.create({
                data: {
                    name: 'Vithesh S',
                    email: 'vitheshs@acemicromatic.com',
                    employeeNo: 'ACE001',
                    designation: 'Software Developer',
                    department: 'Engineering',
                    location: 'Bangalore',
                    systemRoles: ['ADMIN', 'LEARNER'],
                },
            })

            console.log('✅ User created:')
            console.log(JSON.stringify(user, null, 2))
            console.log('\n📋 Copy this user ID for your session:', user.id)
            console.log('\n⚠️  You need to sign out and sign in again to refresh your session')
        }

        // Check all users to see who exists
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                systemRoles: true,
            },
            take: 10,
        })

        console.log(`\n📊 Total users in database (first 10):`)
        allUsers.forEach((u) => {
            console.log(`  - ${u.email} (${u.id}) - ${u.systemRoles.join(', ')}`)
        })
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

ensureVithesh()
