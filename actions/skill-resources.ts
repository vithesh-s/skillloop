'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const skillResourceSchema = z.object({
  skillId: z.string().cuid(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  url: z.string().url(),
  resourceType: z.enum(['UDEMY', 'COURSE', 'ARTICLE', 'VIDEO', 'BOOK', 'DOCUMENTATION', 'TUTORIAL', 'OTHER']),
  estimatedHours: z.number().int().positive().optional(),
  provider: z.string().max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
})

export type SkillResourceInput = z.infer<typeof skillResourceSchema>

// ============================================================================
// CRUD OPERATIONS FOR SKILL RESOURCES
// ============================================================================

/**
 * Get all resources for a skill, optionally filtered by level
 */
export async function getSkillResources(
  skillId: string,
  level?: string
) {
  try {
    const resources = await prisma.skillResource.findMany({
      where: {
        skillId,
        ...(level && { level })
      },
      orderBy: [
        { level: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return resources
  } catch (error) {
    console.error(`Failed to fetch resources for skill ${skillId}:`, error)
    throw new Error("Failed to fetch resources")
  }
}

/**
 * Create a new skill resource
 */
export async function createSkillResource(input: SkillResourceInput) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Only admins can create resources
  if (!session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Admin access required")
  }

  try {
    const validated = skillResourceSchema.parse(input)

    // Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: validated.skillId }
    })

    if (!skill) {
      throw new Error("Skill not found")
    }

    const resource = await prisma.skillResource.create({
      data: validated
    })

    return resource
  } catch (error) {
    console.error("Failed to create skill resource:", error)
    throw error instanceof z.ZodError
      ? new Error("Invalid resource data")
      : new Error("Failed to create resource")
  }
}

/**
 * Update a skill resource
 */
export async function updateSkillResource(
  resourceId: string,
  input: Partial<SkillResourceInput>
) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (!session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Admin access required")
  }

  try {
    const resource = await prisma.skillResource.update({
      where: { id: resourceId },
      data: input
    })

    return resource
  } catch (error) {
    console.error(`Failed to update resource ${resourceId}:`, error)
    throw new Error("Failed to update resource")
  }
}

/**
 * Delete a skill resource
 */
export async function deleteSkillResource(resourceId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (!session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Admin access required")
  }

  try {
    await prisma.skillResource.delete({
      where: { id: resourceId }
    })

    return { success: true }
  } catch (error) {
    console.error(`Failed to delete resource ${resourceId}:`, error)
    throw new Error("Failed to delete resource")
  }
}

/**
 * Batch create resources (for importing from external sources)
 */
export async function batchCreateResources(resources: SkillResourceInput[]) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (!session.user.systemRoles?.includes('ADMIN')) {
    throw new Error("Forbidden: Admin access required")
  }

  try {
    // Validate all resources
    const validated = z.array(skillResourceSchema).parse(resources)

    // Create all resources
    const created = await Promise.all(
      validated.map(resource =>
        prisma.skillResource.create({ data: resource })
      )
    )

    return {
      created: created.length,
      resources: created
    }
  } catch (error) {
    console.error("Failed to batch create resources:", error)
    throw error instanceof z.ZodError
      ? new Error("Invalid resource data")
      : new Error("Failed to create resources")
  }
}

// ============================================================================
// RESOURCE SEARCH & DISCOVERY
// ============================================================================

/**
 * Search for external resources (Udemy, YouTube, etc.)
 * This is a placeholder - in production, integrate with real APIs
 */
export async function searchExternalResources(
  skillName: string,
  level: string,
  resourceType?: string
) {
  try {
    // TODO: Integrate with real APIs like:
    // - Udemy API
    // - YouTube Data API
    // - Pluralsight API
    // - Coursera API
    // - edX API

    // For now, return mock data structure
    const mockResources = [
      {
        title: `${skillName} - ${level} Level Course`,
        description: `Complete ${skillName} course for ${level} level learners`,
        url: `https://www.udemy.com/search/?q=${skillName.replace(' ', '+')}`,
        resourceType: 'UDEMY',
        estimatedHours: 20,
        provider: 'Udemy',
        rating: 4.5,
      },
      {
        title: `Learn ${skillName} - Official Documentation`,
        description: `Official ${skillName} documentation and guides`,
        url: `https://docs.example.com/${skillName.toLowerCase()}`,
        resourceType: 'DOCUMENTATION',
        estimatedHours: 10,
        provider: 'Official',
        rating: 5,
      },
      {
        title: `${skillName} Tutorial Series`,
        description: `Video tutorial series for ${skillName} by industry experts`,
        url: `https://www.youtube.com/search?q=${skillName.replace(' ', '+')}+tutorial`,
        resourceType: 'VIDEO',
        estimatedHours: 15,
        provider: 'YouTube',
        rating: 4.2,
      },
    ]

    return mockResources
  } catch (error) {
    console.error("Failed to search external resources:", error)
    throw new Error("Failed to search resources")
  }
}

// ============================================================================
// RESOURCE RECOMMENDATIONS FOR TRAINING
// ============================================================================

/**
 * Get recommended resources for a skill gap
 * Used to populate training recommendations
 */
export async function getResourcesForGap(
  skillId: string,
  currentLevel: string,
  desiredLevel: string
) {
  try {
    // Get resources for levels between current and desired
    const levelOrder = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
    const currentIdx = levelOrder.indexOf(currentLevel)
    const desiredIdx = levelOrder.indexOf(desiredLevel)

    const relevantLevels = levelOrder.slice(currentIdx + 1, desiredIdx + 1)

    const resources = await prisma.skillResource.findMany({
      where: {
        skillId,
        level: { in: relevantLevels },
        isApproved: true
      },
      orderBy: [
        { level: 'asc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10 // Max 10 recommendations
    })

    return resources
  } catch (error) {
    console.error("Failed to get resources for gap:", error)
    throw new Error("Failed to fetch resources")
  }
}
