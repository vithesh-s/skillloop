import { PrismaClient, CompetencyLevel } from '@prisma/client';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/**
 * SKILL MANAGEMENT LOGIC FOR VITHESH (vitheshs@acemicromatic.com)
 * 
 * This demonstrates the proper distinction between:
 * 1. PERSONAL SKILLS - Skills the user already has (self-assessed or previously certified)
 * 2. ASSIGNED SKILLS - Skills assigned by admin/manager as job requirements
 * 
 * KEY RULES:
 * =========
 * 
 * A) PERSONAL SKILLS (Skills I Already Have):
 *    - These are skills the user has been assessed on before
 *    - They do NOT require training or reassessment
 *    - Stored in SkillMatrix with:
 *      * currentLevel = desiredLevel (no gap)
 *      * status = 'completed'
 *      * gapPercentage = 0
 *      * source = 'PERSONAL' (optional flag for clarity)
 *      * lastAssessedDate = past date
 * 
 *    EXAMPLE: User learned React 2 years ago, assessed as INTERMEDIATE
 *    → SkillMatrix: currentLevel=INTERMEDIATE, desiredLevel=INTERMEDIATE, gap=0%, status=completed
 * 
 * B) ASSIGNED SKILLS - NEW (Skills I Don't Have):
 *    - Skills assigned by admin/manager that user hasn't learned
 *    - REQUIRE training and assessment
 *    - Stored in SkillMatrix with:
 *      * currentLevel = NULL (or BEGINNER if never assessed)
 *      * desiredLevel = set by admin (e.g., INTERMEDIATE)
 *      * gapPercentage = 100% (full gap)
 *      * status = 'gap_identified'
 *      * source = 'ASSIGNED'
 * 
 *    EXAMPLE: Admin assigns Python skill, user never learned it
 *    → SkillMatrix: currentLevel=NULL, desiredLevel=INTERMEDIATE, gap=100%, status=gap_identified
 * 
 * C) ASSIGNED SKILLS - ALREADY HAVE (Conflict Scenario):
 *    - Admin assigns a skill that user already has personally
 *    - This is a JOB REQUIREMENT, so even if user has the skill, they must:
 *      * Take training for organizational standards
 *      * Take assessment to prove competency for this role
 * 
 *    HANDLING OPTIONS:
 *    
 *    Option 1: SEPARATE ENTRIES (Recommended)
 *    → Keep personal skill entry: currentLevel=INTERMEDIATE, desiredLevel=INTERMEDIATE, gap=0%, source=PERSONAL
 *    → Create NEW requirement entry: currentLevel=NULL, desiredLevel=ADVANCED, gap=100%, source=ASSIGNED
 *    → User must complete training/assessment for the ASSIGNED entry even though they have personal skill
 * 
 *    Option 2: UPDATE EXISTING (Simpler but loses history)
 *    → Update the existing personal skill entry
 *    → Set new desiredLevel higher than current: desiredLevel=ADVANCED (if current=INTERMEDIATE)
 *    → Creates gap that requires training/assessment
 *    → Change status from 'completed' to 'gap_identified'
 * 
 *    EXAMPLE: User has React (personal, INTERMEDIATE). Admin assigns React as requirement (ADVANCED)
 *    
 *    With Option 1:
 *    Entry 1 (Personal): currentLevel=INTERMEDIATE, desiredLevel=INTERMEDIATE, gap=0%, source=PERSONAL
 *    Entry 2 (Assigned): currentLevel=INTERMEDIATE, desiredLevel=ADVANCED, gap=33%, source=ASSIGNED
 *    
 *    With Option 2:
 *    Single Entry: currentLevel=INTERMEDIATE, desiredLevel=ADVANCED, gap=33%, source=ASSIGNED
 * 
 * RECOMMENDED APPROACH: Option 1 (Separate Entries)
 * - Preserves personal skill history
 * - Clear audit trail of what's personal vs organizational requirement
 * - Allows different desired levels for personal achievement vs job requirement
 */

async function seedVitheshExample() {
    console.log('🎯 Seeding Example Data for Vithesh (vitheshs@acemicromatic.com)\n');

    // Find Vithesh
    const vithesh = await prisma.user.findUnique({
        where: { email: 'vitheshs@acemicromatic.com' },
        include: { assignedRole: true }
    });

    if (!vithesh) {
        console.log('❌ User vitheshs@acemicromatic.com not found!');
        console.log('💡 Make sure you run the main seed first: npm run db:seed');
        return;
    }

    console.log(`✅ Found user: ${vithesh.name}`);
    console.log(`📋 Role: ${vithesh.assignedRole?.name || 'No role assigned'}\n`);

    // Get some skills
    const skills = await prisma.skill.findMany({
        where: {
            name: {
                in: ['C# Programming', 'ASP.NET Core Web API', '.NET Core Framework', 'Entity Framework Core', 'Azure DevOps', 'SQL Server']
            }
        }
    });

    const skillMap = new Map(skills.map(s => [s.name, s]));

    console.log(`✅ Found ${skills.length} skills for demonstration\n`);

    // Clear existing skill matrix for Vithesh
    console.log('🧹 Clearing existing skill matrix for Vithesh...');
    await prisma.skillMatrix.deleteMany({
        where: { userId: vithesh.id }
    });
    console.log('✅ Cleared\n');

    console.log('='.repeat(80));
    console.log('SCENARIO 1: PERSONAL SKILLS (Skills Vithesh Already Has)');
    console.log('='.repeat(80));
    console.log('These are skills Vithesh learned and was assessed on previously.');
    console.log('NO training or assessment needed for these.\n');

    const personalSkills = [
        {
            skill: skillMap.get('C# Programming')!,
            currentLevel: CompetencyLevel.ADVANCED,
            desiredLevel: CompetencyLevel.ADVANCED,
            notes: 'C# developer for 3 years, multiple projects'
        },
        {
            skill: skillMap.get('SQL Server')!,
            currentLevel: CompetencyLevel.INTERMEDIATE,
            desiredLevel: CompetencyLevel.INTERMEDIATE,
            notes: 'Database design and query optimization experience'
        },
        {
            skill: skillMap.get('.NET Core Framework')!,
            currentLevel: CompetencyLevel.INTERMEDIATE,
            desiredLevel: CompetencyLevel.INTERMEDIATE,
            notes: 'Built several .NET Core applications'
        }
    ];

    console.log('Creating PERSONAL skill entries:\n');

    for (const ps of personalSkills) {
        if (!ps.skill) {
            console.log(`⚠️  Skill not found in database, skipping...`);
            continue;
        }

        await prisma.skillMatrix.create({
            data: {
                userId: vithesh.id,
                skillId: ps.skill.id,
                currentLevel: ps.currentLevel,
                desiredLevel: ps.desiredLevel,
                gapPercentage: 0, // No gap - they already have the desired level
                status: 'completed',
                lastAssessedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
            }
        });

        console.log(`  ✓ ${ps.skill.name}: ${ps.currentLevel} (${ps.notes})`);
        console.log(`    → Gap: 0% | Status: completed | No training needed\n`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('SCENARIO 2: ASSIGNED SKILLS - NEW (Skills Vithesh Doesn\'t Have)');
    console.log('='.repeat(80));
    console.log('These are skills assigned by admin/manager that Vithesh needs to learn.');
    console.log('REQUIRES training and assessment.\n');

    const newAssignedSkills = [
        {
            skill: skillMap.get('Azure DevOps')!,
            desiredLevel: CompetencyLevel.INTERMEDIATE,
            notes: 'New requirement for CI/CD pipeline management'
        },
        {
            skill: skillMap.get('Entity Framework Core')!,
            desiredLevel: CompetencyLevel.ADVANCED,
            notes: 'Required for ORM expertise in new projects'
        }
    ];

    console.log('Creating NEW ASSIGNED skill entries:\n');

    for (const as of newAssignedSkills) {
        if (!as.skill) {
            console.log(`⚠️  Skill not found in database, skipping...`);
            continue;
        }

        await prisma.skillMatrix.create({
            data: {
                userId: vithesh.id,
                skillId: as.skill.id,
                currentLevel: null, // Never learned this skill
                desiredLevel: as.desiredLevel,
                gapPercentage: 100, // 100% gap - complete training needed
                status: 'gap_identified',
                lastAssessedDate: null,
            }
        });

        console.log(`  ○ ${as.skill.name}: NULL → ${as.desiredLevel} (${as.notes})`);
        console.log(`    → Gap: 100% | Status: gap_identified | TRAINING REQUIRED\n`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('SCENARIO 3: ASSIGNED SKILL - ALREADY HAVE (Conflict Case)');
    console.log('='.repeat(80));
    console.log('Admin assigns ASP.NET Core Web API as job requirement at ADVANCED level.');
    console.log('Vithesh doesn\'t have this in his personal skills yet.');
    console.log('But let\'s assume he learned it independently at INTERMEDIATE.');
    console.log('Even though he has the skill, he must train to reach ADVANCED for the role.\n');

    const conflictSkill = skillMap.get('ASP.NET Core Web API')!;

    if (conflictSkill) {
        console.log('✨ HANDLING APPROACH: Create separate ASSIGNED entry\n');
        console.log('Scenario: Vithesh learned ASP.NET Core Web API independently (INTERMEDIATE)');
        console.log('Admin now requires ADVANCED level for his role\n');

        await prisma.skillMatrix.create({
            data: {
                userId: vithesh.id,
                skillId: conflictSkill.id,
                currentLevel: CompetencyLevel.INTERMEDIATE, // He has it, but not at desired level
                desiredLevel: CompetencyLevel.ADVANCED, // Admin requires ADVANCED
                gapPercentage: calculateGap(CompetencyLevel.ADVANCED, CompetencyLevel.INTERMEDIATE),
                status: 'gap_identified',
                lastAssessedDate: null, // Needs new assessment for ADVANCED level
            }
        });

        console.log(`  → ASP.NET Core Web API: INTERMEDIATE → ADVANCED (gap=33%, organizational requirement)`);
        console.log(`    TRAINING REQUIRED to bridge gap from INTERMEDIATE to ADVANCED\n`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPLETE SKILL MATRIX FOR VITHESH');
    console.log('='.repeat(80) + '\n');

    const allVitheshSkills = await prisma.skillMatrix.findMany({
        where: { userId: vithesh.id },
        include: { skill: true },
        orderBy: { skill: { name: 'asc' } }
    });

    console.log(`Total entries: ${allVitheshSkills.length}\n`);

    const personalCount = allVitheshSkills.filter(s => s.gapPercentage === 0 && s.status === 'completed').length;
    const assignedCount = allVitheshSkills.filter(s => (s.gapPercentage ?? 0) > 0).length;

    console.log('📊 Summary:');
    console.log(`  Personal Skills (completed, no gap): ${personalCount}`);
    console.log(`  Assigned Skills (requires training): ${assignedCount}\n`);

    console.log('Detailed breakdown:\n');

    allVitheshSkills.forEach((entry, idx) => {
        const isPersonal = entry.gapPercentage === 0 && entry.status === 'completed';
        const type = isPersonal ? '✓ PERSONAL' : '○ ASSIGNED';
        const currentDisplay = entry.currentLevel || 'NULL';

        console.log(`${idx + 1}. ${type} | ${entry.skill.name}`);
        console.log(`   Current: ${currentDisplay} → Desired: ${entry.desiredLevel}`);
        console.log(`   Gap: ${entry.gapPercentage}% | Status: ${entry.status}`);
        console.log(`   ${isPersonal ? '✅ No action needed' : '⚠️ Training & assessment required'}\n`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('KEY INSIGHTS');
    console.log('='.repeat(80) + '\n');

    console.log('1. PERSONAL SKILLS vs ASSIGNED SKILLS:');
    console.log('   - Personal skills have gap=0%, status=completed');
    console.log('   - Assigned skills have gap>0%, status=gap_identified');
    console.log('   - This distinction is critical for UI and reporting\n');

    console.log('2. HOW TO ADD/REMOVE PERSONAL SKILLS:');
    console.log('   - Add: Create SkillMatrix with currentLevel=desiredLevel, gap=0%');
    console.log('   - Remove: Delete SkillMatrix entry (soft delete or hard delete)');
    console.log('   - Update: Change currentLevel to reflect new proficiency\n');

    console.log('3. WHEN ADMIN ASSIGNS EXISTING SKILL:');
    console.log('   - Create SEPARATE entry with higher desiredLevel');
    console.log('   - User must complete training even if they "have" the skill');
    console.log('   - This ensures organizational standards are met\n');

    console.log('4. UI RECOMMENDATIONS:');
    console.log('   - Show "My Skills" section for personal skills (gap=0%)');
    console.log('   - Show "Required Training" section for assigned skills (gap>0%)');
    console.log('   - Allow users to self-add personal skills via assessment');
    console.log('   - Only admins can assign skills as requirements\n');

    console.log('\n✅ Vithesh example seeded successfully!');
    console.log('🔍 View in app: http://localhost:3000/employee/skill-gaps\n');
}

function calculateGap(desired: CompetencyLevel, current: CompetencyLevel | null): number {
    const levelValues = {
        [CompetencyLevel.BEGINNER]: 1,
        [CompetencyLevel.INTERMEDIATE]: 2,
        [CompetencyLevel.ADVANCED]: 3,
        [CompetencyLevel.EXPERT]: 4,
        BASIC: 1, // Handle BASIC level if it exists in the enum
    } as Record<CompetencyLevel, number>;

    const desiredNum = levelValues[desired];
    const currentNum = current ? levelValues[current] : 0;

    if (currentNum === 0) return 100; // No skill = 100% gap
    if (currentNum >= desiredNum) return 0; // At or above desired = no gap

    const gap = ((desiredNum - currentNum) / desiredNum) * 100;
    return Math.round(gap * 100) / 100;
}

// Run the seed
seedVitheshExample()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
