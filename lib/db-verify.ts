/**
 * Database Verification Script
 * 
 * This script verifies the database setup and provides basic statistics.
 * Run with: npx tsx lib/db-verify.ts
 */

import 'dotenv/config'
import { db } from './db'

async function verifyDatabase() {
    try {
        console.log('🔍 Verifying database setup...\n')

        // Count records in each table
        const [
            userCount,
            skillCount,
            assessmentCount,
            questionCount,
            attemptCount,
            trainingCount,
            assignmentCount,
            skillMatrixCount,
            roleCompetencyCount,
            systemConfigCount,
            notificationCount,
        ] = await Promise.all([
            db.user.count(),
            db.skill.count(),
            db.assessment.count(),
            db.question.count(),
            db.assessmentAttempt.count(),
            db.training.count(),
            db.trainingAssignment.count(),
            db.skillMatrix.count(),
            db.roleCompetency.count(),
            db.systemConfig.count(),
            db.notification.count(),
        ])

        console.log('📊 Database Statistics:')
        console.log('─────────────────────────────────')
        console.log(`   Users:                ${userCount}`)
        console.log(`   Skills:               ${skillCount}`)
        console.log(`   Assessments:          ${assessmentCount}`)
        console.log(`   Questions:            ${questionCount}`)
        console.log(`   Assessment Attempts:  ${attemptCount}`)
        console.log(`   Trainings:            ${trainingCount}`)
        console.log(`   Training Assignments: ${assignmentCount}`)
        console.log(`   Skill Matrix:         ${skillMatrixCount}`)
        console.log(`   Role Competencies:    ${roleCompetencyCount}`)
        console.log(`   System Configs:       ${systemConfigCount}`)
        console.log(`   Notifications:        ${notificationCount}`)
        console.log('─────────────────────────────────\n')

        // Sample user with relationships
        const sampleUser = await db.user.findFirst({
            where: { role: 'EMPLOYEE' },
            include: {
                manager: true,
                skillMatrix: {
                    include: { skill: true },
                    take: 3,
                },
                _count: {
                    select: {
                        assessmentAttempts: true,
                        trainingAssignments: true,
                    },
                },
            },
        })

        if (sampleUser) {
            console.log('👤 Sample User:')
            console.log('─────────────────────────────────')
            console.log(`   Name:          ${sampleUser.name}`)
            console.log(`   Employee No:   ${sampleUser.employeeNo}`)
            console.log(`   Email:         ${sampleUser.email}`)
            console.log(`   Role:          ${sampleUser.role}`)
            console.log(`   Department:    ${sampleUser.department}`)
            console.log(`   Manager:       ${sampleUser.manager?.name || 'None'}`)
            console.log(`   Assessments:   ${sampleUser._count.assessmentAttempts}`)
            console.log(`   Trainings:     ${sampleUser._count.trainingAssignments}`)
            console.log(`   Skill Matrix:  ${sampleUser.skillMatrix.length} skills tracked`)
            console.log('─────────────────────────────────\n')
        }

        // Sample assessment
        const sampleAssessment = await db.assessment.findFirst({
            include: {
                skill: true,
                _count: {
                    select: { questions: true, attempts: true },
                },
            },
        })

        if (sampleAssessment) {
            console.log('📝 Sample Assessment:')
            console.log('─────────────────────────────────')
            console.log(`   Title:         ${sampleAssessment.title}`)
            console.log(`   Skill:         ${sampleAssessment.skill.skillName}`)
            console.log(`   Questions:     ${sampleAssessment._count.questions}`)
            console.log(`   Attempts:      ${sampleAssessment._count.attempts}`)
            console.log(`   Total Marks:   ${sampleAssessment.totalMarks}`)
            console.log(`   Passing Score: ${sampleAssessment.passingScore}`)
            console.log(`   Duration:      ${sampleAssessment.duration} minutes`)
            console.log(`   Status:        ${sampleAssessment.status}`)
            console.log('─────────────────────────────────\n')
        }

        // Role distribution
        const roleDistribution = await db.user.groupBy({
            by: ['role'],
            _count: true,
        })

        console.log('👥 User Role Distribution:')
        console.log('─────────────────────────────────')
        roleDistribution.forEach((role) => {
            console.log(`   ${role.role.padEnd(10)}: ${role._count}`)
        })
        console.log('─────────────────────────────────\n')

        console.log('✅ Database verification completed successfully!')
    } catch (error) {
        console.error('❌ Database verification failed:', error)
        process.exit(1)
    } finally {
        await db.$disconnect()
    }
}

// Run verification
verifyDatabase()
