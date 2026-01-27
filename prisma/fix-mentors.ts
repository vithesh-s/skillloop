
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

// Setup client with adapter matching the project structure if needed, 
// strictly standard client might fail if the environment relies on the adapter for edge/serverless compatibility 
// but for a script, standard client usually works if connection string is direct.
// However, the project uses pg adapter. Let's use it to be safe.

const connectionString = process.env.DATABASE_URL;
console.log('Connection String defined:', !!connectionString);

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Starting fix-mentors script...');
  console.log('Checking roles...');
  
  const trainers = await prisma.user.count({ where: { systemRoles: { has: 'TRAINER' } } });
  const mentors = await prisma.user.count({ where: { systemRoles: { has: 'MENTOR' } } });
  const managers = await prisma.user.count({ where: { systemRoles: { has: 'MANAGER' } } });
  
  console.log(`Current counts - Trainers: ${trainers}, Mentors: ${mentors}, Managers: ${managers}`);

  if (mentors === 0) {
    console.log('⚠️ No mentors found. Promoting Managers and Senior employees to Mentors...');

    // Find users who are Managers or have "Senior" or "Lead" in designation
    const eligibleUsers = await prisma.user.findMany({
      where: {
        OR: [
          { systemRoles: { has: 'MANAGER' } },
          { designation: { contains: 'Senior', mode: 'insensitive' } },
          { designation: { contains: 'Lead', mode: 'insensitive' } },
          { designation: { contains: 'Manager', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`Found ${eligibleUsers.length} eligible users for promotion.`);

    let updatedCount = 0;
    for (const user of eligibleUsers) {
      const currentRoles = user.systemRoles || [];
      // Add MENTOR role if not present
      if (!currentRoles.includes('MENTOR')) {
         await prisma.user.update({
           where: { id: user.id },
           data: {
             systemRoles: {
               push: 'MENTOR'
             }
           }
         });
         updatedCount++;
      }
    }
    console.log(`✅ Promoted ${updatedCount} users to MENTOR role.`);
  } else {
    console.log('✅ Mentors already exist.');
  }

  // Also ensure at least one TRAINER exists
  if (trainers === 0) {
     console.log('⚠️ No trainers found. Promoting some users to Trainers...');
     // Just pick the first 3 senior/lead folks
     const potentialTrainers = await prisma.user.findMany({
        where: {
             OR: [
              { designation: { contains: 'Senior', mode: 'insensitive' } },
              { designation: { contains: 'Lead', mode: 'insensitive' } }
             ]
        },
        take: 3
     });

     for (const user of potentialTrainers) {
        const currentRoles = user.systemRoles || [];
        if (!currentRoles.includes('TRAINER')) {
            await prisma.user.update({
                where: { id: user.id },
                data: { systemRoles: { push: 'TRAINER' } }
            });
        }
     }
     console.log(`✅ Promoted ${potentialTrainers.length} users to TRAINER role.`);
  }

}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
