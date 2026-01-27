"use server"

/**
 * Skill Matrix & Gap Analysis Server Actions
 * Phase 5: Core gap calculation engine and TNA generation
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
  skillMatrixSchema,
  updateDesiredLevelSchema,
  gapAnalysisFiltersSchema,
  tnaFilterSchema,
  batchSkillMatrixUpdateSchema,
  addUserSkillSchema,
  type SkillMatrixInput,
  type UpdateDesiredLevelInput,
  type GapAnalysisFiltersInput,
  type TNAFiltersInput,
  type BatchSkillMatrixUpdateInput,
  type AddUserSkillInput
} from "@/lib/validation"
import {
  type SkillGapData,
  GapCategory,
  type TNAReport,
  type OrganizationTNA,
  type TrainingRecommendation,
  type GapThresholds,
  type DepartmentTNASummary,
  type RoleTNASummary,
  type SkillGapSummary
} from "@/types/skill-matrix"
import { Prisma, CompetencyLevel } from "@prisma/client"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function levelToNumeric(level: CompetencyLevel | null): number {
  if (!level) return 0
  const mapping: Record<CompetencyLevel, number> = {
    BEGINNER: 1,
    BASIC: 2,
    INTERMEDIATE: 3,
    ADVANCED: 4,
    EXPERT: 5,
  }
  return mapping[level]
}

function numericToLevel(value: number): CompetencyLevel | null {
  const mapping: Record<number, CompetencyLevel> = {
    1: 'BEGINNER',
    2: 'BASIC',
    3: 'INTERMEDIATE',
    4: 'ADVANCED',
    5: 'EXPERT',
  }
  return mapping[value] || null
}

function calculateGapPercentageInternal(
  desiredLevel: CompetencyLevel,
  currentLevel: CompetencyLevel | null
): number {
  const desired = levelToNumeric(desiredLevel)
  const current = levelToNumeric(currentLevel)

  if (desired === 0) return 0
  if (current === 0) return 100
  if (current >= desired) return 0

  const gap = ((desired - current) / desired) * 100
  return Math.round(gap * 100) / 100
}

export async function calculateGapPercentage(
  desiredLevel: CompetencyLevel,
  currentLevel: CompetencyLevel | null
): Promise<number> {
  return calculateGapPercentageInternal(desiredLevel, currentLevel)
}

async function getGapThresholds(): Promise<GapThresholds> {
  try {
    const [critical, high, medium] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "criticalGapThreshold" } }),
      prisma.systemConfig.findUnique({ where: { key: "highGapThreshold" } }),
      prisma.systemConfig.findUnique({ where: { key: "mediumGapThreshold" } }),
    ])

    return {
      critical: critical ? parseFloat(critical.value) : 50,
      high: high ? parseFloat(high.value) : 30,
      medium: medium ? parseFloat(medium.value) : 15,
    }
  } catch (error) {
    console.error('Failed to fetch gap thresholds, using defaults:', error)
    return {
      critical: 50,
      high: 30,
      medium: 15,
    }
  }
}

function categorizeGapInternal(
  gapPercentage: number,
  thresholds: GapThresholds
): GapCategory {
  if (gapPercentage === 0) return GapCategory.NONE
  if (gapPercentage > thresholds.critical) return GapCategory.CRITICAL
  if (gapPercentage > thresholds.high) return GapCategory.HIGH
  if (gapPercentage > thresholds.medium) return GapCategory.MEDIUM
  return GapCategory.LOW
}

export async function categorizeGap(
  gapPercentage: number,
  thresholds?: GapThresholds
): Promise<GapCategory> {
  const config = thresholds || await getGapThresholds()
  return categorizeGapInternal(gapPercentage, config)
}

function determineStatus(gapPercentage: number, hasTraining: boolean): string {
  if (gapPercentage === 0) return 'completed'
  if (hasTraining) return 'training_assigned'
  if (gapPercentage > 0) return 'gap_identified'
  return 'not_started'
}

// ============================================================================
// CORE GAP CALCULATION FUNCTIONS
// ============================================================================

export async function updateSkillMatrixGaps(userId: string): Promise<number> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.id !== userId && !session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Cannot update another user's skill matrix")
  }

  try {
    const skillMatrixEntries = await prisma.skillMatrix.findMany({
      where: { userId },
      include: {
        skill: true,
      }
    })

    if (skillMatrixEntries.length === 0) {
      return 0
    }

    const thresholds = await getGapThresholds()

    const trainingAssignments = await prisma.trainingAssignment.findMany({
      where: {
        userId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      include: {
        training: {
          select: { skillId: true }
        }
      }
    })

    const skillsWithTraining = new Set(
      trainingAssignments.map(ta => ta.training.skillId)
    )

    const updates = skillMatrixEntries.map((entry) => {
      const newGapPercentage = calculateGapPercentageInternal(entry.desiredLevel, entry.currentLevel)
      const gapCategory = categorizeGapInternal(newGapPercentage, thresholds)
      const hasTraining = skillsWithTraining.has(entry.skillId)
      const newStatus = determineStatus(newGapPercentage, hasTraining)

      return prisma.skillMatrix.update({
        where: { id: entry.id },
        data: {
          gapPercentage: newGapPercentage,
          status: newStatus,
          updatedAt: new Date(),
        }
      })
    })

    await prisma.$transaction(updates)

    revalidatePath(`/employee/skill-gaps`)
    revalidatePath(`/admin/tna`)

    return updates.length
  } catch (error) {
    console.error(`Failed to update skill matrix gaps for user ${userId}:`, error)
    throw new Error("Failed to recalculate skill gaps")
  }
}

// ============================================================================
// CRUD OPERATIONS FOR SKILL MATRIX
// ============================================================================

export async function getUserSkillMatrix(
  userId: string,
  filters?: GapAnalysisFiltersInput,
  skip: number = 0,
  take: number = 50
): Promise<SkillGapData[]> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isOwnData = session.user.id === userId
  const isAdmin = session.user.systemRoles?.includes('ADMIN')
  const isManager = session.user.systemRoles?.includes('MANAGER')

  if (!isOwnData && !isAdmin && !isManager) {
    throw new Error("Forbidden: Cannot access another user's skill matrix")
  }

  if (isManager && !isAdmin && !isOwnData) {
    const managedUser = await prisma.user.findFirst({
      where: { id: userId, managerId: session.user.id }
    })
    if (!managedUser) {
      throw new Error("Forbidden: User is not your reportee")
    }
  }

  try {
    const validatedFilters = filters ? gapAnalysisFiltersSchema.parse(filters) : {}

    const where: Prisma.SkillMatrixWhereInput = {
      userId,
      ...(validatedFilters.categoryId && {
        skill: { categoryId: validatedFilters.categoryId }
      }),
      ...(validatedFilters.status && {
        status: { in: validatedFilters.status }
      }),
      ...(validatedFilters.searchTerm && {
        skill: {
          name: { contains: validatedFilters.searchTerm, mode: 'insensitive' }
        }
      })
    }

    const skillMatrixEntries = await prisma.skillMatrix.findMany({
      where,
      include: {
        skill: {
          include: {
            category: true,
          }
        },
        user: {
          select: {
            assessmentAttempts: {
              where: {
                assessment: { skillId: { not: undefined } }
              },
              select: {
                id: true,
                completedAt: true,
                assessment: {
                  select: { skillId: true }
                }
              },
              orderBy: { completedAt: 'desc' }
            }
          }
        }
      },
      orderBy: [
        { gapPercentage: 'desc' },
        { skill: { name: 'asc' } }
      ],
      skip,
      take
    })

    const trainingAssignments = await prisma.trainingAssignment.findMany({
      where: {
        userId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      include: {
        training: {
          select: { skillId: true }
        }
      }
    })

    const skillsWithTraining = new Set(
      trainingAssignments.map(ta => ta.training.skillId)
    )

    const thresholds = await getGapThresholds()

    const skillGapsWithNulls = await Promise.all(
      skillMatrixEntries.map(async (entry) => {
        const gapPercentage = entry.gapPercentage ?? 100
        const gapCategory = await categorizeGap(gapPercentage, thresholds)

        if (validatedFilters.gapCategories && !validatedFilters.gapCategories.includes(gapCategory)) {
          return null
        }

        const skillAssessments = entry.user.assessmentAttempts.filter(
          attempt => attempt.assessment.skillId === entry.skillId
        )
        const lastAssessment = skillAssessments[0]

        const hasTraining = skillsWithTraining.has(entry.skillId)

        return {
          skillId: entry.skillId,
          skillName: entry.skill.name,
          categoryId: entry.skill.categoryId,
          categoryName: entry.skill.category.name,
          categoryColor: entry.skill.category.colorClass || 'gray-500',
          desiredLevel: entry.desiredLevel,
          currentLevel: entry.currentLevel,
          gapPercentage,
          gapCategory,
          lastAssessedDate: lastAssessment?.completedAt || null,
          status: entry.status as any,
          assessmentCount: skillAssessments.length,
          trainingAssigned: hasTraining,
        } as SkillGapData
      })
    )

    const skillGaps = skillGapsWithNulls.filter((gap): gap is SkillGapData => gap !== null)

    return skillGaps
  } catch (error) {
    console.error(`Failed to fetch skill matrix for user ${userId}:`, error)
    throw new Error("Failed to retrieve skill matrix")
  }
}

export async function createSkillMatrixEntry(
  data: SkillMatrixInput
): Promise<string> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const validated = skillMatrixSchema.parse(data)

  if (validated.userId !== session.user.id && !session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Cannot create skill matrix for another user")
  }

  try {
    // Check if user exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: validated.userId },
    });

    if (!userExists) {
      throw new Error("User does not exist");
    }

    // Check if skill matrix entry already exists
    const existing = await prisma.skillMatrix.findUnique({
      where: {
        userId_skillId: {
          userId: validated.userId,
          skillId: validated.skillId,
        }
      }
    })

    if (existing) {
      throw new Error("Skill already exists in user's matrix")
    }

    const skill = await prisma.skill.findUnique({
      where: { id: validated.skillId }
    })

    if (!skill) {
      throw new Error("Skill not found")
    }

    const currentLevel = validated.currentLevel || null

    // Calculate initial gap and status
    const thresholds = await getGapThresholds()
    const gapPercentage = calculateGapPercentageInternal(validated.desiredLevel, currentLevel)

    // Check for existing training to set correct initial status
    const hasTraining = await prisma.trainingAssignment.count({
      where: {
        userId: validated.userId,
        training: { skillId: validated.skillId },
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      }
    }) > 0

    // If we have a current level, we can determine a real status
    // If no current level (gap=100), status defaults to 'not_started' or 'gap_identified' via determineStatus
    const status = determineStatus(gapPercentage, hasTraining)

    const entry = await prisma.skillMatrix.create({
      data: {
        userId: validated.userId,
        skillId: validated.skillId,
        desiredLevel: validated.desiredLevel,
        currentLevel: currentLevel,
        gapPercentage: gapPercentage,
        status: status,
      }
    })

    revalidatePath(`/employee/skill-gaps`)
    revalidatePath(`/admin/tna`)

    return entry.id
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    console.error('Failed to create skill matrix entry:', error)
    throw new Error("Failed to add skill to matrix")
  }
}

export async function addUserSkill(
  data: AddUserSkillInput
): Promise<{ success: boolean; message: string; skillMatrixId?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const validated = addUserSkillSchema.parse(data)
    const userId = session.user.id

    // Verify user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists) {
      console.error('User not found in database:', userId)
      return { success: false, message: "User account not found. Please log in again." }
    }

    // Convert numeric levels (1-5) to CompetencyLevel enum (5 levels)
    // Mapping: 1=BEGINNER, 2=BASIC, 3=INTERMEDIATE, 4=ADVANCED, 5=EXPERT
    const levelMapping: Record<number, CompetencyLevel> = {
      1: 'BEGINNER',
      2: 'BASIC',
      3: 'INTERMEDIATE',
      4: 'ADVANCED',
      5: 'EXPERT',
    }

    const currentLevel = levelMapping[validated.currentLevel]
    const desiredLevel = levelMapping[validated.desiredLevel]

    let skillId = validated.skillId

    // If custom skill name provided, create or find the skill
    if (validated.customSkillName && !skillId) {
      // Check if skill already exists
      let skill = await prisma.skill.findFirst({
        where: {
          name: {
            equals: validated.customSkillName,
            mode: 'insensitive'
          }
        }
      })

      // If skill doesn't exist, create it in "Other" category
      if (!skill) {
        // Find or create "Other" category
        let otherCategory = await prisma.skillCategory.findFirst({
          where: { name: 'Other' }
        })

        if (!otherCategory) {
          otherCategory = await prisma.skillCategory.create({
            data: {
              name: 'Other',
              description: 'Miscellaneous skills',
              colorClass: 'slate-500'
            }
          })
        }

        skill = await prisma.skill.create({
          data: {
            name: validated.customSkillName,
            categoryId: otherCategory.id,
            description: validated.notes || `Custom skill added by ${session.user.name}`,
            proficiencyLevels: ['BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
          }
        })
      }

      skillId = skill.id
    }

    if (!skillId) {
      return { success: false, message: "Skill ID is required" }
    }

    // Check if skill matrix entry already exists
    const existing = await prisma.skillMatrix.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        }
      }
    })

    if (existing) {
      return { success: false, message: "This skill is already in your skill matrix" }
    }

    // Calculate gap percentage properly for personal goals
    const gapPercentage = calculateGapPercentageInternal(desiredLevel, currentLevel)
    const status = 'personal_goal'

    // Create skill matrix entry
    const entry = await prisma.skillMatrix.create({
      data: {
        userId,
        skillId,
        currentLevel,
        desiredLevel,
        gapPercentage,
        status,
        lastAssessedDate: new Date(),
      }
    })

    revalidatePath(`/employee`)
    revalidatePath(`/employee/skill-gaps`)
    revalidatePath(`/admin/tna`)

    return {
      success: true,
      message: 'Skill added successfully to your personal development goals!',
      skillMatrixId: entry.id
    }
  } catch (error) {
    console.error('Error adding user skill:', error)
    console.error('Session user ID:', session.user.id)
    
    // Check for foreign key constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      console.error('Foreign key constraint violation - userId may not exist in User table')
      return { success: false, message: "Your user account could not be found. Please log out and log in again." }
    }
    
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to add skill" }
  }
}

export async function updateDesiredLevel(
  data: UpdateDesiredLevelInput
): Promise<void> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const validated = updateDesiredLevelSchema.parse(data)

  if (validated.userId !== session.user.id && !session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Cannot update another user's skill matrix")
  }

  try {
    const entry = await prisma.skillMatrix.findUnique({
      where: {
        userId_skillId: {
          userId: validated.userId,
          skillId: validated.skillId,
        }
      }
    })

    if (!entry) {
      throw new Error("Skill matrix entry not found")
    }

    // Check if this is a personal goal - if so, preserve the status and don't calculate gap
    const isPersonalGoal = entry.status === 'personal_goal'

    let newGapPercentage: number
    let newStatus: string

    if (isPersonalGoal) {
      // Personal goals don't have gap calculations
      newGapPercentage = 0
      newStatus = 'personal_goal'
    } else {
      // For role-assigned skills, calculate gap normally
      newGapPercentage = calculateGapPercentageInternal(validated.desiredLevel, entry.currentLevel)
      const hasTraining = await prisma.trainingAssignment.count({
        where: {
          userId: validated.userId,
          training: { skillId: validated.skillId },
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
        }
      }) > 0
      newStatus = determineStatus(newGapPercentage, hasTraining)
    }

    await prisma.skillMatrix.update({
      where: { id: entry.id },
      data: {
        desiredLevel: validated.desiredLevel,
        gapPercentage: newGapPercentage,
        status: newStatus,
        updatedAt: new Date(),
      }
    })

    revalidatePath(`/employee/skill-gaps`)
    revalidatePath(`/admin/tna`)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    console.error('Failed to update desired level:', error)
    throw new Error("Failed to update skill level")
  }
}

export async function deleteSkillMatrixEntry(
  userId: string,
  skillId: string
): Promise<void> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (userId !== session.user.id && !session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Cannot delete another user's skill matrix entry")
  }

  try {
    await prisma.skillMatrix.delete({
      where: {
        userId_skillId: {
          userId,
          skillId,
        }
      }
    })

    revalidatePath(`/employee/skill-gaps`)
    revalidatePath(`/admin/tna`)
  } catch (error) {
    console.error('Failed to delete skill matrix entry:', error)
    throw new Error("Failed to remove skill from matrix")
  }
}

export async function batchUpdateDesiredLevels(
  data: BatchSkillMatrixUpdateInput
): Promise<number> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const validated = batchSkillMatrixUpdateSchema.parse(data)

  if (validated.userId !== session.user.id && !session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Cannot update another user's skill matrix")
  }

  try {
    const updates = validated.updates.map(update =>
      updateDesiredLevel({
        userId: validated.userId,
        skillId: update.skillId,
        desiredLevel: update.desiredLevel,
      })
    )

    await Promise.all(updates)

    revalidatePath(`/employee/skill-gaps`)
    revalidatePath(`/admin/tna`)

    return validated.updates.length
  } catch (error) {
    console.error('Failed to batch update desired levels:', error)
    throw new Error("Failed to update multiple skills")
  }
}

export async function syncUserSkillsWithRole(
  userId: string,
  roleId: string
): Promise<void> {
  const session = await auth()
  // Internal function, but verify session exists for safety unless called from internal context
  // We'll rely on caller permissions (users.ts checks admin)

  try {
    // 1. Get competencies for the role
    const roleCompetencies = await prisma.roleCompetency.findMany({
      where: { roleId },
      include: { skill: true }
    })

    if (roleCompetencies.length === 0) return

    // 2. Get existing skill matrix for user
    const existingMatrix = await prisma.skillMatrix.findMany({
      where: { userId }
    })

    const matrixMap = new Map(existingMatrix.map(em => [em.skillId, em]))
    const thresholds = await getGapThresholds()

    // 3. Process each competency
    const updates = []

    for (const competency of roleCompetencies) {
      // Map string level to enum
      const requiredLevel = competency.requiredLevel as CompetencyLevel
      const existing = matrixMap.get(competency.skillId)

      if (existing) {
        // Update desired level if different
        if (existing.desiredLevel !== requiredLevel) {
          const newGap = calculateGapPercentageInternal(requiredLevel, existing.currentLevel)

          // Check training status for status update
          const hasTraining = await prisma.trainingAssignment.count({
            where: {
              userId,
              training: { skillId: competency.skillId },
              status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
            }
          }) > 0

          const newStatus = determineStatus(newGap, hasTraining)

          updates.push(
            prisma.skillMatrix.update({
              where: { id: existing.id },
              data: {
                desiredLevel: requiredLevel,
                gapPercentage: newGap,
                status: newStatus,
                updatedAt: new Date()
              }
            })
          )
        }
      } else {
        // Create new entry
        // Default current level is null (0)
        const gapPercentage = calculateGapPercentageInternal(requiredLevel, null)
        const status = determineStatus(gapPercentage, false) // New assignment likely has no training yet

        updates.push(
          prisma.skillMatrix.create({
            data: {
              userId,
              skillId: competency.skillId,
              desiredLevel: requiredLevel,
              currentLevel: null,
              gapPercentage,
              status
            }
          })
        )
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates)
      revalidatePath(`/employee/skill-gaps`)
      revalidatePath(`/admin/tna`)
    }

  } catch (error) {
    console.error(`Failed to sync skills for user ${userId} and role ${roleId}:`, error)
    // Don't throw, just log - we don't want to break the user update flow
  }
}

// ============================================================================
// GAP ANALYSIS & TNA GENERATION
// ============================================================================

export async function analyzeUserSkillGaps(
  userId: string,
  filters?: GapAnalysisFiltersInput
) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isOwnData = session.user.id === userId
  const isAdmin = session.user.systemRoles?.includes('ADMIN')
  const isManager = session.user.systemRoles?.includes('MANAGER')

  if (!isOwnData && !isAdmin && !isManager) {
    throw new Error("Forbidden")
  }

  if (isManager && !isAdmin && !isOwnData) {
    const managedUser = await prisma.user.findFirst({
      where: { id: userId, managerId: session.user.id }
    })
    if (!managedUser) {
      throw new Error("Forbidden")
    }
  }

  try {
    const skillGaps = await getUserSkillMatrix(userId, filters)

    const totalSkills = skillGaps.length
    const criticalGaps = skillGaps.filter(g => g.gapCategory === GapCategory.CRITICAL).length
    const highGaps = skillGaps.filter(g => g.gapCategory === GapCategory.HIGH).length
    const mediumGaps = skillGaps.filter(g => g.gapCategory === GapCategory.MEDIUM).length
    const lowGaps = skillGaps.filter(g => g.gapCategory === GapCategory.LOW).length
    const completedSkills = skillGaps.filter(g => g.gapCategory === GapCategory.NONE).length

    const averageGap = totalSkills > 0
      ? skillGaps.reduce((sum, g) => sum + g.gapPercentage, 0) / totalSkills
      : 0

    const gapsByCategory = skillGaps.reduce((acc, gap) => {
      if (!acc[gap.categoryName]) {
        acc[gap.categoryName] = []
      }
      acc[gap.categoryName].push(gap)
      return acc
    }, {} as Record<string, SkillGapData[]>)

    return {
      userId,
      skillGaps,
      totalSkills,
      criticalGapsCount: criticalGaps,
      highGapsCount: highGaps,
      mediumGapsCount: mediumGaps,
      lowGapsCount: lowGaps,
      completedSkillsCount: completedSkills,
      averageGapPercentage: Math.round(averageGap * 100) / 100,
      gapsByCategory,
    }
  } catch (error) {
    console.error(`Failed to analyze skill gaps for user ${userId}:`, error)
    throw new Error("Failed to analyze skill gaps")
  }
}

export async function getTrainingRecommendations(
  userId: string
): Promise<TrainingRecommendation[]> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isOwnData = session.user.id === userId
  const isAdmin = session.user.systemRoles?.includes('ADMIN')
  const isManager = session.user.systemRoles?.includes('MANAGER')

  if (!isOwnData && !isAdmin && !isManager) {
    throw new Error("Forbidden")
  }

  try {
    const skillGaps = await getUserSkillMatrix(userId)

    const gapsNeedingTraining = skillGaps.filter(
      gap => gap.gapCategory !== GapCategory.NONE && !gap.trainingAssigned
    )

    const skillIds = gapsNeedingTraining.map(gap => gap.skillId)

    const trainings = await prisma.training.findMany({
      where: {
        skillId: { in: skillIds },
      },
      include: {
        skill: true,
        creator: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    const skillMatrixMap = await prisma.skillMatrix.findMany({
      where: { userId, skillId: { in: skillIds } }
    }).then(entries =>
      Object.fromEntries(entries.map(e => [e.skillId, e]))
    )

    const recommendations: TrainingRecommendation[] = await Promise.all(
      trainings.map(async (training) => {
        const gap = gapsNeedingTraining.find(g => g.skillId === training.skillId)!
        const skillMatrix = skillMatrixMap[training.skillId]

        let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
        if (gap.gapCategory === GapCategory.CRITICAL) priority = 'CRITICAL'
        else if (gap.gapCategory === GapCategory.HIGH) priority = 'HIGH'
        else if (gap.gapCategory === GapCategory.MEDIUM) priority = 'MEDIUM'
        else priority = 'LOW'

        const resources = skillMatrix
          ? await (prisma as any).skillResource.findMany({
            where: {
              skillId: training.skillId,
              isApproved: true,
              level: {
                in: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
              }
            },
            take: 5,
            orderBy: [
              { rating: 'desc' },
              { createdAt: 'desc' }
            ]
          })
          : []

        return {
          trainingId: training.id,
          trainingName: training.topicName,
          skillId: training.skillId,
          skillName: training.skill.name,
          priority,
          estimatedDuration: training.duration,
          mode: training.mode,
          availableSeats: training.mode === 'OFFLINE' && training.maxParticipants ? training.maxParticipants : undefined,
          nextAvailableDate: undefined,
          mentorAvailable: false,
          resources: resources.map((r: any) => ({
            resourceId: r.id,
            title: r.title,
            url: r.url,
            resourceType: r.resourceType,
            estimatedHours: r.estimatedHours || undefined,
            provider: r.provider || undefined,
            rating: r.rating || undefined,
          }))
        }
      })
    )

    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return recommendations
  } catch (error) {
    console.error(`Failed to get training recommendations for user ${userId}:`, error)
    throw new Error("Failed to get training recommendations")
  }
}

export async function generateUserTNA(userId: string): Promise<TNAReport> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isOwnData = session.user.id === userId
  const isAdmin = session.user.systemRoles?.includes('ADMIN')
  const isManager = session.user.systemRoles?.includes('MANAGER')

  if (!isOwnData && !isAdmin && !isManager) {
    throw new Error("Forbidden")
  }

  if (isManager && !isAdmin && !isOwnData) {
    const managedUser = await prisma.user.findFirst({
      where: { id: userId, managerId: session.user.id }
    })
    if (!managedUser) {
      throw new Error("Forbidden")
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedRole: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!user) {
      throw new Error("User not found")
    }

    const analysis = await analyzeUserSkillGaps(userId)
    const recommendations = await getTrainingRecommendations(userId)

    const report: TNAReport = {
      userId: user.id,
      userName: user.name,
      email: user.email,
      department: user.department,
      roleId: user.roleId,
      roleName: user.assignedRole?.name || null,
      skillGaps: analysis.skillGaps,
      overallGapScore: analysis.averageGapPercentage,
      criticalGapsCount: analysis.criticalGapsCount,
      highGapsCount: analysis.highGapsCount,
      mediumGapsCount: analysis.mediumGapsCount,
      lowGapsCount: analysis.lowGapsCount,
      skillsCompletedCount: analysis.completedSkillsCount,
      totalSkillsTracked: analysis.totalSkills,
      recommendations,
      generatedAt: new Date(),
    }

    return report
  } catch (error) {
    console.error(`Failed to generate TNA for user ${userId}:`, error)
    throw new Error("Failed to generate TNA report")
  }
}

export async function generateDepartmentTNA(
  department: string,
  filters?: TNAFiltersInput
): Promise<DepartmentTNASummary> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isAdmin = session.user.systemRoles?.includes('ADMIN')
  const isManager = session.user.systemRoles?.includes('MANAGER')

  if (!isAdmin && !isManager) {
    throw new Error("Forbidden: Insufficient permissions")
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        department,
        ...(isManager && !isAdmin && { managerId: session.user.id })
      },
      select: {
        id: true,
        skillMatrix: {
          include: {
            skill: true,
          }
        }
      }
    })

    if (users.length === 0) {
      throw new Error("No users found in department")
    }

    let totalGapScore = 0
    let criticalGapsCount = 0
    const skillGapMap: Record<string, { count: number; totalGap: number; skillName: string }> = {}

    const thresholds = await getGapThresholds()

    for (const user of users) {
      for (const entry of user.skillMatrix) {
        const gapPercentage = entry.gapPercentage ?? 100
        totalGapScore += gapPercentage

        const gapCategory = await categorizeGap(gapPercentage, thresholds)
        if (gapCategory === GapCategory.CRITICAL) {
          criticalGapsCount++
        }

        if (!skillGapMap[entry.skillId]) {
          skillGapMap[entry.skillId] = {
            count: 0,
            totalGap: 0,
            skillName: entry.skill.name,
          }
        }
        skillGapMap[entry.skillId].count++
        skillGapMap[entry.skillId].totalGap += gapPercentage
      }
    }

    const totalSkills = users.reduce((sum, u) => sum + u.skillMatrix.length, 0)
    const averageGapScore = totalSkills > 0 ? totalGapScore / totalSkills : 0

    const sortedSkills = Object.entries(skillGapMap)
      .sort(([, a], [, b]) => b.totalGap / b.count - a.totalGap / a.count)
      .slice(0, 5)
      .map(([, data]) => data.skillName)

    const summary: DepartmentTNASummary = {
      department,
      employeeCount: users.length,
      averageGapScore: Math.round(averageGapScore * 100) / 100,
      criticalGapsCount,
      topGapSkills: sortedSkills,
    }

    return summary
  } catch (error) {
    console.error(`Failed to generate department TNA for ${department}:`, error)
    throw new Error("Failed to generate department TNA")
  }
}

export async function generateOrganizationTNA(
  filters?: TNAFiltersInput,
  skip: number = 0,
  take?: number // Optional - if not provided, returns all employees
): Promise<OrganizationTNA> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isAdmin = session.user.systemRoles?.includes('ADMIN')
  const isManager = session.user.systemRoles?.includes('MANAGER')

  if (!isAdmin && !isManager) {
    throw new Error("Forbidden: Admin or Manager access required")
  }


  try {
    const validatedFilters = filters ? tnaFilterSchema.parse(filters) : null

    const userWhere: Prisma.UserWhereInput = {
      ...(validatedFilters?.department && { department: validatedFilters.department }),
      ...(validatedFilters?.roleId && { roleId: validatedFilters.roleId }),
      // If Manager (and not Admin), modify query to only show reporting employees
      ...(!isAdmin && isManager && { managerId: session.user.id }),
    }

    const skillMatrixWhere: Prisma.SkillMatrixWhereInput = {
      user: userWhere
    }

    const thresholds = await getGapThresholds()

    const [
      totalEmployees,
      totalSkillsTracked,
      avgGapResult,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      userGapStats,
      skillGapStats
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.skillMatrix.count({ where: skillMatrixWhere }),
      prisma.skillMatrix.aggregate({
        where: skillMatrixWhere,
        _avg: { gapPercentage: true }
      }),
      prisma.skillMatrix.count({ where: { ...skillMatrixWhere, gapPercentage: { gt: thresholds.critical } } }),
      prisma.skillMatrix.count({ where: { ...skillMatrixWhere, gapPercentage: { gt: thresholds.high, lte: thresholds.critical } } }),
      prisma.skillMatrix.count({ where: { ...skillMatrixWhere, gapPercentage: { gt: thresholds.medium, lte: thresholds.high } } }),
      prisma.skillMatrix.count({ where: { ...skillMatrixWhere, gapPercentage: { lte: thresholds.medium, gt: 0 } } }),
      prisma.skillMatrix.groupBy({
        by: ['userId'],
        _avg: { gapPercentage: true },
        where: skillMatrixWhere
      }),
      prisma.skillMatrix.groupBy({
        by: ['skillId'],
        _avg: { gapPercentage: true },
        _count: { userId: true },
        where: { ...skillMatrixWhere, gapPercentage: { gt: 0 } }
      })
    ])

    const organizationGapScore = avgGapResult._avg.gapPercentage || 0

    const allUsers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, department: true, roleId: true, assignedRole: { select: { name: true } } }
    })

    const userGapMap = new Map(userGapStats.map(u => [u.userId, u._avg.gapPercentage || 0]))
    const departmentMap = new Map<string, { count: number; totalGap: number; critical: number }>()
    const roleMap = new Map<string, { name: string; count: number; totalGap: number; critical: number }>()

    for (const user of allUsers) {
      const gap = userGapMap.get(user.id) || 0
      const isCritical = gap > thresholds.critical

      if (user.department) {
        if (!departmentMap.has(user.department)) {
          departmentMap.set(user.department, { count: 0, totalGap: 0, critical: 0 })
        }
        const dept = departmentMap.get(user.department)!
        dept.count++
        dept.totalGap += gap
        if (isCritical) dept.critical++
      }

      if (user.roleId) {
        if (!roleMap.has(user.roleId)) {
          roleMap.set(user.roleId, {
            name: user.assignedRole?.name || 'Unknown',
            count: 0,
            totalGap: 0,
            critical: 0
          })
        }
        const role = roleMap.get(user.roleId)!
        role.count++
        role.totalGap += gap
        if (isCritical) role.critical++
      }
    }

    const departmentBreakdown: DepartmentTNASummary[] = Array.from(departmentMap.entries()).map(([dept, stats]) => ({
      department: dept,
      employeeCount: stats.count,
      averageGapScore: stats.count > 0 ? Math.round((stats.totalGap / stats.count) * 100) / 100 : 0,
      criticalGapsCount: stats.critical,
      topGapSkills: []
    }))

    const roleBreakdown: RoleTNASummary[] = Array.from(roleMap.entries()).map(([roleId, stats]) => ({
      roleId,
      roleName: stats.name,
      employeeCount: stats.count,
      averageGapScore: stats.count > 0 ? Math.round((stats.totalGap / stats.count) * 100) / 100 : 0,
      criticalGapsCount: stats.critical,
      commonGapSkills: []
    }))

    const skillIds = skillGapStats.map(s => s.skillId)
    const skills = await prisma.skill.findMany({
      where: { id: { in: skillIds } },
      include: { category: true }
    })
    const skillMap = new Map(skills.map(s => [s.id, s]))

    const topGapSkills: SkillGapSummary[] = skillGapStats
      .map(s => {
        const skill = skillMap.get(s.skillId)
        return {
          skillId: s.skillId,
          skillName: skill?.name || 'Unknown',
          categoryName: skill?.category?.name || 'Unknown',
          employeesAffected: s._count.userId,
          averageGap: Math.round((s._avg.gapPercentage || 0) * 100) / 100,
          recommendedTrainings: []
        }
      })
      .sort((a, b) => b.averageGap - a.averageGap)
      .slice(0, 10)

    const paginatedUsers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
      skip,
      ...(take && { take }), // Only apply take if provided
      orderBy: { name: 'asc' }
    })

    const employeeTNAs = await Promise.all(
      paginatedUsers.map(user => generateUserTNA(user.id))
    )

    const report: OrganizationTNA = {
      totalEmployees,
      totalSkillsTracked,
      organizationGapScore: Math.round(organizationGapScore * 100) / 100,
      criticalGapsTotal: criticalCount,
      highGapsTotal: highCount,
      mediumGapsTotal: mediumCount,
      lowGapsTotal: lowCount,
      departmentBreakdown,
      roleBreakdown,
      topGapSkills,
      employeeTNAs,
      generatedAt: new Date(),
    }

    return report
  } catch (error) {
    console.error('Failed to generate organization TNA:', error)
    throw new Error("Failed to generate organization TNA report")
  }
}
