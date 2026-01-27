
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const trainers = await prisma.user.count({
    where: { systemRoles: { has: 'TRAINER' } }
  });
  
  const mentors = await prisma.user.count({
    where: { systemRoles: { has: 'MENTOR' } }
  });
  
  const managers = await prisma.user.count({
    where: { systemRoles: { has: 'MANAGER' } }
  });

  console.log('Trainers:', trainers);
  console.log('Mentors:', mentors);
  console.log('Managers:', managers);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
