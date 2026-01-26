/**
 * Update user role to ADMIN
 * Quick script for development purposes
 */

import 'dotenv/config'
import { db } from './db'

async function updateUserToAdmin() {
    try {
        const email = 'vitheshs@acemicromatic.com'

        // Check if user exists
        const user = await db.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.log(`❌ User not found: ${email}`)
            return
        }

        console.log(`👤 Current user details:`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Current System Roles: ${user.systemRoles.join(', ')}`)
        console.log(`   Department: ${user.department}`)

        // Update roles to ADMIN, MANAGER, and LEARNER
        const updatedUser = await db.user.update({
            where: { email },
            data: { systemRoles: ['ADMIN', 'MANAGER', 'LEARNER'] }
        })

        console.log(`\n✅ Successfully updated roles`)
        console.log(`   New System Roles: ${updatedUser.systemRoles.join(', ')}`)

    } catch (error) {
        console.error('❌ Error updating user:', error)
    } finally {
        await db.$disconnect()
    }
}

updateUserToAdmin()
