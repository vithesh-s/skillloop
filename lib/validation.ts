/**
 * Zod Validation Schemas and Utilities
 * 
 * Centralized validation schemas for form data validation
 * Used with Server Actions and useActionState hook
 */

import { z } from 'zod'

// ============================================================================
// USER VALIDATION SCHEMAS
// ============================================================================

export const userSchema = z.object({
    employeeNo: z.string().min(1, 'Employee number is required'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    systemRoles: z.array(z.enum(['ADMIN', 'TRAINER', 'MENTOR', 'MANAGER', 'LEARNER'])).min(1, 'At least one system role is required'),
    designation: z.string().min(2, 'Designation is required'),
    department: z.string().min(1, 'Department is required'),
    location: z.string().min(1, 'Location is required'),
    managerId: z.string().nullable().optional(),
    roleId: z.string().min(1).optional().or(z.literal('')),
    dateOfJoining: z.string().transform(str => new Date(str)),
    level: z.number().min(1, 'Level must be at least 1').max(10, 'Level cannot exceed 10'),
})

export const updateUserSchema = userSchema.extend({
    userId: z.string(),
})

// ============================================================================
// SKILL VALIDATION SCHEMAS
// ============================================================================

export const skillSchema = z.object({
    name: z.string().min(2, 'Skill name must be at least 2 characters'),
    categoryId: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
    proficiencyLevels: z.array(z.string()).optional(),
})

export const updateSkillSchema = skillSchema.extend({
    id: z.string(),
})

// ============================================================================
// ROLE COMPETENCY VALIDATION SCHEMAS
// ============================================================================

export const skillRequirementSchema = z.object({
    skillId: z.string(),
    requiredLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
    isMandatory: z.boolean(),
})

export const roleFrameworkSchema = z.object({
    jobRole: z.string().min(2, 'Job role is required'),
    skillRequirements: z
        .array(skillRequirementSchema)
        .min(1, 'At least one skill is required')
        .refine(
            (requirements) => requirements.some(req => req.isMandatory),
            { message: 'At least one skill must be mandatory' }
        ),
})

// ============================================================================
// SYSTEM CONFIG VALIDATION SCHEMAS
// ============================================================================

export const systemConfigSchema = z.object({
    // Induction Settings
    inductionDurationDays: z.number().min(1).max(365),
    autoAssignInductionTraining: z.boolean(),

    // Assessment Settings
    defaultPassingScore: z.number().min(0).max(100),
    allowRetakes: z.boolean(),
    maxRetakeAttempts: z.number().min(0).max(10),
    assessmentTimerEnabled: z.boolean(),

    // Training Settings
    defaultTrainingDuration: z.number().min(1),
    requireMentorApproval: z.boolean(),
    autoSendReminders: z.boolean(),
    reminderFrequencyDays: z.number().min(1).max(90),

    // Notification Settings
    emailNotificationsEnabled: z.boolean(),
    enabledNotificationTypes: z.array(z.string()),

    // Skill Gap Settings
    criticalGapThreshold: z.number().min(0).max(100),
    highGapThreshold: z.number().min(0).max(100),
    mediumGapThreshold: z.number().min(0).max(100),
}).refine(
    (data) =>
        data.criticalGapThreshold > data.highGapThreshold &&
        data.highGapThreshold > data.mediumGapThreshold,
    {
        message: 'Thresholds must be in descending order: Critical > High > Medium',
        path: ['criticalGapThreshold'],
    }
)

// ============================================================================
// TYPE INFERENCE - Export TypeScript types from schemas
// ============================================================================

export type UserInput = z.infer<typeof userSchema>
export type SkillInput = z.infer<typeof skillSchema>
export type RoleFrameworkInput = z.infer<typeof roleFrameworkSchema>
export type SystemConfigInput = z.infer<typeof systemConfigSchema>

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Format Zod validation errors for useActionState
 * Converts ZodError to a structure compatible with form error display
 */
export function formatZodErrors(error: z.ZodError) {
    return error.flatten().fieldErrors
}

/**
 * Helper to safely parse FormData with Zod schema
 * Returns structured response for useActionState
 */
export function validateFormData<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
    const result = schema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    return {
        success: false,
        errors: formatZodErrors(result.error),
    }
}

/**
 * Extract and transform FormData to object for validation
 */
export function formDataToObject(formData: FormData): Record<string, any> {
    const obj: Record<string, any> = {}

    for (const [key, value] of formData.entries()) {
        // Handle nested keys (e.g., "user.name")
        if (key.includes('.')) {
            const keys = key.split('.')
            let current = obj

            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = current[keys[i]] || {}
                current = current[keys[i]]
            }

            current[keys[keys.length - 1]] = value
        } else {
            // Try to parse JSON strings (for arrays/objects)
            if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                try {
                    obj[key] = JSON.parse(value)
                } catch {
                    obj[key] = value
                }
            } else {
                obj[key] = value
            }
        }
    }

    return obj
}
