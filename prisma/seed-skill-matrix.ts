import { PrismaClient, CompetencyLevel } from '@prisma/client';
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
    adapter,
});

/**
 * Seed Skill Matrix Data
 * Assigns software development skills to employees based on their roles
 * 
 * HOW SKILL ASSIGNMENT WORKS:
 * 1. Role-based assignment: When users are assigned to a JobRole that has RoleCompetencies,
 *    those skills should be tracked in SkillMatrix
 * 2. Manual assignment: Admins/Managers can directly assign skills to users via SkillMatrix CRUD
 * 
 * SKILL TYPES:
 * - Existing Skills: currentLevel is set (e.g., INTERMEDIATE) - employee already has this skill,
 *   no assessment or training needed unless they want to advance
 * - New Skills (Gap Skills): currentLevel is NULL - employee needs to learn this skill,
 *   requires assessment and training
 * 
 * EXAMPLE SCENARIOS:
 * - Software Engineer assigned to role → Gets 5 role competency skills
 *   → 2 existing skills (has INTERMEDIATE, desired INTERMEDIATE) = NO GAP
 *   → 3 new skills (has NULL, desired INTERMEDIATE) = 100% GAP, needs training
 * 
 * - Senior Engineer → Gets advanced skills
 *   → Some they already have at INTERMEDIATE, need to reach ADVANCED = PARTIAL GAP
 *   → Some they don't have yet = FULL GAP
 */

async function seedSkillMatrix() {
    console.log('🎯 Starting Skill Matrix seed...\n');

    // Get all skills (should already exist from main seed)
    const skills = await prisma.skill.findMany({
        orderBy: { name: 'asc' }
    });

    if (skills.length === 0) {
        console.log('❌ No skills found! Run main seed first: npm run db:seed');
        return;
    }

    console.log(`✅ Found ${skills.length} skills\n`);

    // Get all job roles
    const roles = await prisma.jobRole.findMany({
        include: {
            competencies: {
                include: { skill: true }
            }
        }
    });

    console.log(`✅ Found ${roles.length} job roles\n`);

    // Get all users (70 employees from seed)
    const users = await prisma.user.findMany({
        where: {
            roleId: { not: null } // Only users with assigned roles
        },
        include: {
            assignedRole: {
                include: {
                    competencies: {
                        include: { skill: true }
                    }
                }
            }
        }
    });

    console.log(`✅ Found ${users.length} users with assigned roles\n`);

    // Helper to convert string level to CompetencyLevel enum
    const toCompetencyLevel = (level: string): CompetencyLevel => {
        const normalized = level.toUpperCase();
        if (normalized === 'BEGINNER') return CompetencyLevel.BEGINNER;
        if (normalized === 'INTERMEDIATE') return CompetencyLevel.INTERMEDIATE;
        if (normalized === 'ADVANCED') return CompetencyLevel.ADVANCED;
        if (normalized === 'EXPERT') return CompetencyLevel.EXPERT;
        return CompetencyLevel.BEGINNER;
    };

    // Clear existing skill matrix entries (development only)
    console.log('🧹 Clearing existing skill matrix entries...');
    await prisma.skillMatrix.deleteMany();
    console.log('✅ Cleared\n');

    // Track statistics
    let totalAssigned = 0;
    let existingSkills = 0;
    let newSkills = 0;

    console.log('📊 Assigning skills to users based on their roles...\n');

    for (const user of users) {
        if (!user.assignedRole) continue;

        console.log(`👤 ${user.name} (${user.assignedRole.name}):`);

        const roleCompetencies = user.assignedRole.competencies;

        for (const competency of roleCompetencies) {
            const desiredLevel = toCompetencyLevel(competency.requiredLevel);

            // Randomly decide if this is an existing skill or new skill
            // 40% chance they already have this skill, 60% chance it's new
            const isExistingSkill = Math.random() < 0.4;

            let currentLevel: CompetencyLevel | null = null;
            let status = 'gap_identified';

            if (isExistingSkill) {
                // They already have this skill - set current level
                // Current level is 0-2 levels below desired
                const desiredNum = levelToNumber(desiredLevel);
                const currentNum = Math.max(1, desiredNum - Math.floor(Math.random() * 3));
                currentLevel = numberToLevel(currentNum);

                // If current equals desired, no gap
                if (currentLevel === desiredLevel) {
                    status = 'completed';
                }

                existingSkills++;
                console.log(`  ✓ ${competency.skill.name}: ${currentLevel} → ${desiredLevel} (existing skill)`);
            } else {
                // New skill - they don't have it yet (currentLevel = null)
                currentLevel = null;
                newSkills++;
                console.log(`  ○ ${competency.skill.name}: NULL → ${desiredLevel} (new skill, needs training)`);
            }

            // Calculate gap percentage
            const gapPercentage = calculateGap(desiredLevel, currentLevel);

            // Create skill matrix entry
            await prisma.skillMatrix.create({
                data: {
                    userId: user.id,
                    skillId: competency.skillId,
                    desiredLevel,
                    currentLevel,
                    gapPercentage,
                    status,
                    lastAssessedDate: isExistingSkill ? new Date() : null,
                }
            });

            totalAssigned++;
        }

        console.log('');
    }

    console.log('✅ Skill Matrix Seeding Complete!\n');
    console.log('📊 Statistics:');
    console.log(`  Total skills assigned: ${totalAssigned}`);
    console.log(`  Existing skills (have current level): ${existingSkills} (${((existingSkills / totalAssigned) * 100).toFixed(1)}%)`);
    console.log(`  New skills (need training): ${newSkills} (${((newSkills / totalAssigned) * 100).toFixed(1)}%)`);
    console.log('');
    console.log('🎓 Summary:');
    console.log(`  - ${existingSkills} skills show PARTIAL or NO GAP (employees already have some proficiency)`);
    console.log(`  - ${newSkills} skills show 100% GAP (employees need assessment and training)`);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Check employee skill gaps: http://localhost:3000/employee/skill-gaps');
    console.log('  2. View TNA report: http://localhost:3000/admin/tna');
    console.log('  3. All 70 employees should now be visible in the Employees tab!');
    console.log('');
}

// Helper functions
function levelToNumber(level: CompetencyLevel): number {
    switch (level) {
        case CompetencyLevel.BEGINNER: return 1;
        case CompetencyLevel.INTERMEDIATE: return 2;
        case CompetencyLevel.ADVANCED: return 3;
        case CompetencyLevel.EXPERT: return 4;
    }
}

function numberToLevel(num: number): CompetencyLevel {
    switch (num) {
        case 1: return CompetencyLevel.BEGINNER;
        case 2: return CompetencyLevel.INTERMEDIATE;
        case 3: return CompetencyLevel.ADVANCED;
        case 4: return CompetencyLevel.EXPERT;
        default: return CompetencyLevel.BEGINNER;
    }
}

function calculateGap(desired: CompetencyLevel, current: CompetencyLevel | null): number {
    const desiredNum = levelToNumber(desired);
    const currentNum = current ? levelToNumber(current) : 0;

    if (currentNum === 0) return 100; // No current skill = 100% gap
    if (currentNum >= desiredNum) return 0; // At or above desired = no gap

    const gap = ((desiredNum - currentNum) / desiredNum) * 100;
    return Math.round(gap * 100) / 100;
}

// Run the seed
seedSkillMatrix()
    .catch((e) => {
        console.error('❌ Skill Matrix seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
