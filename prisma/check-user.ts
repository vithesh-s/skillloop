import { prisma } from "../lib/prisma"

async function checkUser() {
    try {
        // Check vitheshs@acemicromatic.com
        const user = await prisma.user.findUnique({
            where: { email: "vitheshs@acemicromatic.com" },
            select: {
                id: true,
                name: true,
                email: true,
                systemRoles: true,
            },
        })

        if (user) {
            console.log("✅ User found:")
            console.log(JSON.stringify(user, null, 2))
        } else {
            console.log("❌ User not found!")
        }

        // Check all users
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
            },
        })

        console.log(`\n📊 Total users in database: ${allUsers.length}`)
        console.log("\nAll users:")
        allUsers.forEach((u) => {
            console.log(`  - ${u.email} (${u.id})`)
        })
    } catch (error) {
        console.error("Error:", error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUser()
