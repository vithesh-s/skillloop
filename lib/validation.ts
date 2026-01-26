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
    employeeNo: z.string().optional(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    systemRoles: z.array(z.enum(['ADMIN', 'TRAINER', 'MENTOR', 'MANAGER', 'LEARNER'])).min(1, 'At least one system role is required'),
    designation: z.string().optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    managerId: z.string().nullable().optional(),
    roleId: z.string().min(1).optional().or(z.literal('')),
    dateOfJoining: z.string().optional().transform(str => str ? new Date(str) : undefined),
    level: z.string().transform(val => parseInt(val, 10)).optional().or(z.number().optional()),
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
// ASSESSMENT VALIDATION SCHEMAS
// ============================================================================

export const assessmentSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    skillId: z.string().min(1, 'Skill is required'),
    totalMarks: z.coerce.number().min(1, 'Total marks must be at least 1'),
    passingScore: z.coerce.number().min(0).max(100, 'Passing score must be between 0 and 100'),
    duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
    isPreAssessment: z.coerce.boolean(),
})

export const questionSchema = z.object({
    skillId: z.string().min(1, 'Skill is required'),
    questionText: z.string().min(5, 'Question must be at least 5 characters'),
    questionType: z.enum(['MCQ', 'DESCRIPTIVE', 'TRUE_FALSE', 'FILL_BLANK']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    marks: z.coerce.number().min(1, 'Marks must be at least 1'),
    difficultyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
}).refine(
    (data) => {
        // MCQ must have at least 2 options and a correct answer
        if (data.questionType === 'MCQ') {
            return data.options && data.options.length >= 2 && data.correctAnswer
        }
        // TRUE_FALSE and FILL_BLANK must have correct answer
        if (data.questionType === 'TRUE_FALSE' || data.questionType === 'FILL_BLANK') {
            return !!data.correctAnswer
        }
        // DESCRIPTIVE doesn't need options or correct answer
        return true
    },
    {
        message: 'Invalid question configuration for the selected question type',
        path: ['questionType'],
    }
)

export const bulkQuestionSchema = z.array(questionSchema)

export const assessmentAttemptSchema = z.object({
    assessmentId: z.string(),
    answers: z.array(z.object({
        questionId: z.string(),
        answerText: z.string(),
    })),
})

export const answerSchema = z.object({
    questionId: z.string(),
    answerText: z.string().min(1, 'Answer is required'),
})

export const gradingSchema = z.object({
    answerId: z.string(),
    marksAwarded: z.coerce.number().min(0, 'Marks cannot be negative'),
    trainerFeedback: z.string().optional(),
})

// ============================================================================
// SKILL MATRIX & GAP ANALYSIS VALIDATION SCHEMAS
// ============================================================================

export const skillMatrixSchema = z.object({
    userId: z.string().min(1, 'User is required'),
    skillId: z.string().min(1, 'Skill is required'),
    desiredLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
}).refine(
    (data) => {
        // Ensure userId and skillId are valid CUIDs
        return data.userId.length > 0 && data.skillId.length > 0
    },
    { message: 'Invalid user or skill ID format' }
)

export const updateDesiredLevelSchema = z.object({
    userId: z.string().cuid('Invalid user ID'),
    skillId: z.string().cuid('Invalid skill ID'),
    desiredLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
    currentLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
}).refine(
    (data) => {
        // Ensure desired level is not lower than current level if current exists
        if (data.currentLevel) {
            const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
            const desiredIdx = levels.indexOf(data.desiredLevel)
            const currentIdx = levels.indexOf(data.currentLevel)
            return desiredIdx >= currentIdx
        }
        return true
    },
    { message: 'Desired level cannot be lower than current level' }
)

export const gapAnalysisFiltersSchema = z.object({
    categoryId: z.string().optional(),
    gapCategories: z.array(z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'])).optional(),
    status: z.array(z.enum(['not_started', 'gap_identified', 'training_assigned', 'in_progress', 'completed'])).optional(),
    searchTerm: z.string().max(100).optional(),
})

export const tnaFilterSchema = z.object({
    department: z.string().max(100).optional(),
    roleId: z.string().cuid().optional(),
    gapCategory: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
    dateFrom: z.string().optional().transform(str => str ? new Date(str) : undefined),
    dateTo: z.string().optional().transform(str => str ? new Date(str) : undefined),
    includeCompleted: z.boolean().default(false),
}).refine(
    (data) => {
        // Ensure dateTo is after dateFrom if both provided
        if (data.dateFrom && data.dateTo) {
            return data.dateTo >= data.dateFrom
        }
        return true
    },
    { message: 'End date must be after start date' }
)

export const exportOptionsSchema = z.object({
    format: z.enum(['CSV', 'PDF', 'XLSX']),
    includeCharts: z.boolean().default(false),
    includeRecommendations: z.boolean().default(true),
    includeHistory: z.boolean().default(false),
    filters: tnaFilterSchema.optional(),
})

export const batchSkillMatrixUpdateSchema = z.object({
    userId: z.string().cuid(),
    updates: z.array(z.object({
        skillId: z.string().cuid(),
        desiredLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
    })).min(1, 'At least one update required').max(50, 'Maximum 50 updates per batch'),
})

export const addUserSkillSchema = z.object({
    skillId: z.string().optional(),
    customSkillName: z.string().optional(),
    currentLevel: z.number().int().min(1).max(5),
    desiredLevel: z.number().int().min(1).max(5),
    notes: z.string().max(500).optional(),
}).refine(
    (data) => data.skillId || data.customSkillName,
    { message: 'Either skillId or customSkillName must be provided' }
).refine(
    (data) => data.desiredLevel >= data.currentLevel,
    { message: 'Desired level must be at least the current level' }
)

// ============================================================================
// TYPE INFERENCE - Export TypeScript types from schemas
// ============================================================================

export type UserInput = z.infer<typeof userSchema>
export type SkillInput = z.infer<typeof skillSchema>
export type RoleFrameworkInput = z.infer<typeof roleFrameworkSchema>
export type SystemConfigInput = z.infer<typeof systemConfigSchema>
export type AssessmentFormData = z.infer<typeof assessmentSchema>
export type QuestionFormData = z.infer<typeof questionSchema>
export type AssessmentAttemptData = z.infer<typeof assessmentAttemptSchema>
export type AnswerData = z.infer<typeof answerSchema>
export type GradingData = z.infer<typeof gradingSchema>
export type SkillMatrixInput = z.infer<typeof skillMatrixSchema>
export type UpdateDesiredLevelInput = z.infer<typeof updateDesiredLevelSchema>
export type GapAnalysisFiltersInput = z.infer<typeof gapAnalysisFiltersSchema>
export type TNAFiltersInput = z.infer<typeof tnaFilterSchema>
export type ExportOptionsInput = z.infer<typeof exportOptionsSchema>
export type BatchSkillMatrixUpdateInput = z.infer<typeof batchSkillMatrixUpdateSchema>
export type AddUserSkillInput = z.infer<typeof addUserSkillSchema>


// ============================================================================
// TRAINING MANAGEMENT SCHEMAS
// ============================================================================

export const trainingSchema = z.object({
    topicName: z.string().min(3, 'Topic name must be at least 3 characters'),
    description: z.string().optional(),
    mode: z.enum(['ONLINE', 'OFFLINE']),
    duration: z.coerce.number().min(1, 'Duration must be at least 1 hour'),
    skillId: z.string().min(1, 'Skill is required'),
    resources: z.array(z.object({ title: z.string().optional(), url: z.string().url().optional(), type: z.string().optional() })).optional(), // stored as JSON
    venue: z.string().optional(),
    meetingLink: z.string().url().optional().or(z.literal('')),
    maxParticipants: z.coerce.number().min(1).optional(),
    // Additional fields for learner completion tracking
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    typeOfTraining: z.string().optional(), // e.g., "Technical", "Soft Skills", "Compliance"
    methodOfTraining: z.enum(['ONLINE', 'OFFLINE', 'HYBRID', 'SELF_PACED', 'INSTRUCTOR_LED']).optional(),
    trainingInstitute: z.string().optional(),
    trainerDetails: z.string().optional(), // Trainer name, qualifications, contact
    location: z.string().optional(), // Physical location or platform details
    certificateDetails: z.object({
        certificateNumber: z.string().optional(),
        issuingAuthority: z.string().optional(),
        certificateUrl: z.string().url().optional(),
        expiryDate: z.string().optional(),
    }).optional(),
    remarks: z.string().optional(),
})

export const onlineTrainingSchema = z.object({
    trainingId: z.string(),
    resourceLinks: z.array(z.object({
        title: z.string(),
        url: z.string().url(),
        type: z.string(),
    })).min(1, 'At least one resource is required'),
    estimatedDuration: z.coerce.number().min(1),
    mentorRequired: z.boolean(),
})

export const offlineTrainingSchema = z.object({
    trainingId: z.string(),
    schedule: z.array(z.object({
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        sessionTitle: z.string().optional(),
    })).min(1, 'At least one session is required'),
    venue: z.string().min(1, 'Venue is required'),
    materials: z.array(z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
    })).optional(),
    trainerIds: z.array(z.string()).min(1, 'At least one trainer is required'),
})

export const trainingAssignmentSchema = z.object({
    trainingId: z.string(),
    userIds: z.array(z.string()).min(1, 'At least one user is required'),
    trainerId: z.string().optional(),
    mentorId: z.string().optional(),
    startDate: z.coerce.date(),
    targetCompletionDate: z.coerce.date(),
}).refine(
    (data) => data.targetCompletionDate > data.startDate,
    { message: 'Target completion date must be after start date' }
)

export const bulkTrainingAssignmentSchema = z.object({
    trainingId: z.string(),
    assignments: z.array(z.object({
        userId: z.string(),
        trainerId: z.string().optional(),
        mentorId: z.string().optional(),
        startDate: z.string(),
        targetCompletionDate: z.string(),
    })).min(1, 'At least one assignment is required').max(100, 'Maximum 100 assignments per batch'),
})

export const tnaBasedAssignmentSchema = z.object({
    skillId: z.string(),
    userIds: z.array(z.string()).min(1),
    createNewTraining: z.boolean(),
    existingTrainingId: z.string().optional(),
    trainingData: trainingSchema.optional(),
    startDate: z.string(),
    targetCompletionDate: z.string(),
}).refine(
    (data) => data.createNewTraining ? !!data.trainingData : !!data.existingTrainingId,
    { message: 'Either select existing training or provide new training data' }
)

// Schema for learners to update training completion details
export const trainingCompletionSchema = z.object({
    assignmentId: z.string(),
    actualDateFrom: z.string().min(1, 'Start date is required'),
    actualDateTo: z.string().min(1, 'End date is required'),
    actualDuration: z.coerce.number().min(1, 'Duration must be at least 1 hour'),
    typeOfTraining: z.string().min(1, 'Training type is required'),
    methodOfTraining: z.enum(['ONLINE', 'OFFLINE', 'HYBRID', 'SELF_PACED', 'INSTRUCTOR_LED']),
    trainingInstitute: z.string().optional(),
    trainerDetails: z.string().optional(),
    location: z.string().optional(),
    certificateDetails: z.object({
        certificateNumber: z.string().optional(),
        issuingAuthority: z.string().optional(),
        certificateUrl: z.string().url().optional(),
        expiryDate: z.string().optional(),
    }).optional(),
    remarks: z.string().optional(),

}).refine(
    (data) => new Date(data.actualDateTo) >= new Date(data.actualDateFrom),
    { message: 'End date must be on or after start date' }
)

export type TrainingInput = z.infer<typeof trainingSchema>
export type OnlineTrainingInput = z.infer<typeof onlineTrainingSchema>
export type OfflineTrainingInput = z.infer<typeof offlineTrainingSchema>
export type TrainingAssignmentInput = z.infer<typeof trainingAssignmentSchema>
export type BulkTrainingAssignmentInput = z.infer<typeof bulkTrainingAssignmentSchema>
export type TNABasedAssignmentInput = z.infer<typeof tnaBasedAssignmentSchema>
export type TrainingCompletionInput = z.infer<typeof trainingCompletionSchema>


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
