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
        console.log(`   Current Role: ${user.role}`)
        console.log(`   Department: ${user.department}`)

        // Update role to ADMIN
        const updatedUser = await db.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        })

        console.log(`\n✅ Successfully updated to ADMIN`)
        console.log(`   New Role: ${updatedUser.role}`)

    } catch (error) {
        console.error('❌ Error updating user:', error)
    } finally {
        await db.$disconnect()
    }
}

updateUserToAdmin()
