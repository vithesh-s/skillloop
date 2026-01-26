import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function listSkills() {
    const skills = await prisma.skill.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    console.log(`\nFound ${skills.length} skills:\n`);
    skills.forEach((s, i) => console.log(`${i + 1}. ${s.name} (${s.id})`));
}

listSkills()
    .finally(() => prisma.$disconnect());
