"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
  assessmentSchema,
  questionSchema,
  bulkQuestionSchema,
  answerSchema,
  gradingSchema,
} from "@/lib/validation"

export type FormState = {
  message?: string
  errors?: Record<string, string[]>
  success?: boolean
  data?: any
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export async function createAssessment(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  const validatedFields = assessmentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    skillId: formData.get("skillId"),
    totalMarks: formData.get("totalMarks"),
    passingScore: formData.get("passingScore"),
    duration: formData.get("duration"),
    isPreAssessment: formData.get("isPreAssessment") === "true" || formData.get("isPreAssessment") === "on",
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed",
      success: false,
    }
  }

  // Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { id: true },
  })

  if (!user) {
    return {
      message: "User account not found. Please sign in again.",
      success: false,
    }
  }

  try {
    const assessment = await prisma.assessment.create({
      data: {
        ...validatedFields.data,
        createdById: user.id,
        status: "DRAFT",
      },
    })

    revalidatePath("/admin/assessments")

    return {
      message: "Assessment created successfully",
      success: true,
      data: { assessmentId: assessment.id, skillId: assessment.skillId },
    }
  } catch (error) {
    console.error("Create assessment error:", error)
    return {
      message: "Failed to create assessment",
      success: false,
    }
  }
}

export async function updateAssessment(
  assessmentId: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  const validatedFields = assessmentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    skillId: formData.get("skillId"),
    totalMarks: formData.get("totalMarks"),
    passingScore: formData.get("passingScore"),
    duration: formData.get("duration"),
    isPreAssessment: formData.get("isPreAssessment") === "true" || formData.get("isPreAssessment") === "on",
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed",
      success: false,
    }
  }

  try {
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: validatedFields.data,
    })

    revalidatePath("/admin/assessments")
    revalidatePath(`/admin/assessments/${assessmentId}`)

    return {
      message: "Assessment updated successfully",
      success: true,
    }
  } catch (error) {
    console.error("Update assessment error:", error)
    return {
      message: "Failed to update assessment",
      success: false,
    }
  }
}

// Rename existing delete to archive or create new?
// The user wants strict distinction.

export async function archiveAssessment(assessmentId: string): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  try {
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "ARCHIVED" },
    })

    revalidatePath("/admin/assessments")

    return {
      message: "Assessment archived successfully",
      success: true,
    }
  } catch (error) {
    console.error("Archive assessment error:", error)
    return {
      message: "Failed to archive assessment",
      success: false,
    }
  }
}

export async function deleteAssessment(assessmentId: string): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { status: true }
    })

    if (!assessment) {
      return { message: "Assessment not found", success: false }
    }

    if (assessment.status !== 'DRAFT') {
      return {
        message: "Only DRAFT assessments can be permanently deleted. Please archive PUBLISHED assessments.",
        success: false
      }
    }

    await prisma.assessment.delete({
      where: { id: assessmentId },
    })

    revalidatePath("/admin/assessments")

    return {
      message: "Assessment deleted successfully",
      success: true,
    }
  } catch (error) {
    console.error("Delete assessment error:", error)
    return {
      message: "Failed to delete assessment",
      success: false,
    }
  }
}

export async function publishAssessment(assessmentId: string): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  try {
    // Validate marks before publishing
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          select: { marks: true }
        }
      }
    })

    if (!assessment) {
      return { message: "Assessment not found", success: false }
    }

    const currentTotal = assessment.questions.reduce((sum, q) => sum + q.marks, 0)

    if (currentTotal !== assessment.totalMarks) {
      return {
        message: `Validation Failed: Total question marks (${currentTotal}) must equal Assessment Total Marks (${assessment.totalMarks})`,
        success: false
      }
    }

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "PUBLISHED" },
    })

    revalidatePath("/admin/assessments")
    revalidatePath(`/admin/assessments/${assessmentId}`)

    return {
      message: "Assessment published successfully",
      success: true,
    }
  } catch (error) {
    console.error("Publish assessment error:", error)
    return {
      message: "Failed to publish assessment",
      success: false,
    }
  }
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

export async function getAssessments(params?: {
  skillId?: string
  status?: string
  isPreAssessment?: boolean
  page?: number
  limit?: number
  search?: string
}) {
  const session = await auth()

  if (!session?.user) {
    return { assessments: [], total: 0, pages: 0 }
  }

  const { skillId, status, isPreAssessment, page = 1, limit = 10, search } = params || {}
  const skip = (page - 1) * limit

  const where: any = {}
  if (skillId) where.skillId = skillId
  if (status && status !== 'ALL') where.status = status
  if (isPreAssessment !== undefined) where.isPreAssessment = isPreAssessment
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    // Check if user is strictly a learner
    const isLearnerOnly = !session.user.systemRoles?.some(role => ['ADMIN', 'TRAINER', 'MANAGER'].includes(role))

    // Learner Filter: Only show assigned assessments + 'PUBLISHED' status
    if (isLearnerOnly) {
      where.assignments = {
        some: {
          userId: session.user.id
        }
      }
      where.status = 'PUBLISHED'
    }

    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: {
          skill: true,
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
          // Include assignment data for learners
          ...(isLearnerOnly ? {
            assignments: {
              where: { userId: session.user.id },
              select: { status: true, dueDate: true }
            }
          } : {})
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.assessment.count({ where }),
    ])

    return { assessments, total, pages: Math.ceil(total / limit) }
  } catch (error) {
    console.error("Get assessments error:", error)
    return { assessments: [], total: 0, pages: 0 }
  }
}

export async function getAssessmentById(assessmentId: string) {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
        },
        skill: true,
        creator: true,
        _count: {
          select: {
            attempts: true,
            questions: true,
          },
        },
      },
    })

    return assessment
  } catch (error) {
    console.error("Get assessment error:", error)
    return null
  }
}

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

export async function addQuestion(
  assessmentId: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  // Parse options if present
  let options: string[] | undefined
  const optionsStr = formData.get("options")
  if (optionsStr && typeof optionsStr === "string") {
    try {
      options = JSON.parse(optionsStr)
    } catch {
      options = undefined
    }
  }

  const validatedFields = questionSchema.safeParse({
    skillId: formData.get("skillId"),
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    options,
    correctAnswer: formData.get("correctAnswer") || undefined,
    marks: formData.get("marks"),
    difficultyLevel: formData.get("difficultyLevel"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed",
      success: false,
    }
  }

  try {
    // Get max orderIndex, assessment details, and current total marks
    const [maxOrder, assessment, currentTotal] = await Promise.all([
      prisma.question.aggregate({
        where: { assessmentId },
        _max: { orderIndex: true },
      }),
      prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: { skillId: true, totalMarks: true }
      }),
      prisma.question.aggregate({
        where: { assessmentId },
        _sum: { marks: true },
      })
    ])

    if (!assessment) {
      return { message: "Assessment not found", success: false }
    }

    // Validate total marks won't exceed target
    const currentMarks = currentTotal._sum.marks || 0
    const newTotalMarks = currentMarks + validatedFields.data.marks
    
    if (newTotalMarks > assessment.totalMarks) {
      const excess = newTotalMarks - assessment.totalMarks
      return {
        message: `Cannot add question. This would exceed the target score by ${excess} marks. Target: ${assessment.totalMarks}, Current: ${currentMarks}, Adding: ${validatedFields.data.marks}`,
        success: false,
      }
    }

    const orderIndex = (maxOrder._max.orderIndex || 0) + 1

    await prisma.question.create({
      data: {
        ...validatedFields.data,
        assessmentId,
        orderIndex,
        options: validatedFields.data.options || undefined,
        // skillId is already included in ...validatedFields.data
      },
    })

    revalidatePath(`/admin/assessments/${assessmentId}`)

    return {
      message: "Question added successfully",
      success: true,
    }
  } catch (error) {
    console.error("Add question error:", error)
    return {
      message: "Failed to add question",
      success: false,
    }
  }
}

export async function updateQuestion(
  questionId: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  let options: string[] | undefined
  const optionsStr = formData.get("options")
  if (optionsStr && typeof optionsStr === "string") {
    try {
      options = JSON.parse(optionsStr)
    } catch {
      options = undefined
    }
  }

  const validatedFields = questionSchema.safeParse({
    skillId: formData.get("skillId"),
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    options,
    correctAnswer: formData.get("correctAnswer") || undefined,
    marks: formData.get("marks"),
    difficultyLevel: formData.get("difficultyLevel"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed",
      success: false,
    }
  }

  try {
    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...validatedFields.data,
        options: validatedFields.data.options || undefined,
      },
    })

    revalidatePath(`/admin/assessments/${question.assessmentId}`)

    return {
      message: "Question updated successfully",
      success: true,
    }
  } catch (error) {
    console.error("Update question error:", error)
    return {
      message: "Failed to update question",
      success: false,
    }
  }
}

export async function deleteQuestion(questionId: string): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { assessmentId: true, orderIndex: true },
    })

    if (!question) {
      return { message: "Question not found", success: false }
    }

    // Delete question (cascade will delete related answers)
    await prisma.question.delete({
      where: { id: questionId },
    })

    // Reorder remaining questions
    await prisma.question.updateMany({
      where: {
        assessmentId: question.assessmentId,
        orderIndex: { gt: question.orderIndex },
      },
      data: {
        orderIndex: { decrement: 1 },
      },
    })

    revalidatePath(`/admin/assessments/${question.assessmentId}`)

    return {
      message: "Question deleted successfully",
      success: true,
    }
  } catch (error) {
    console.error("Delete question error:", error)
    return {
      message: "Failed to delete question",
      success: false,
    }
  }
}

export async function bulkUploadQuestions(
  assessmentId: string,
  questionsData: any[]
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  const validatedFields = bulkQuestionSchema.safeParse(questionsData)

  if (!validatedFields.success) {
    return {
      message: "Validation failed for bulk questions: " + JSON.stringify(validatedFields.error.flatten()),
      success: false,
    }
  }

  try {
    // Get current max orderIndex
    const maxOrder = await prisma.question.aggregate({
      where: { assessmentId },
      _max: { orderIndex: true },
    })

    let currentOrder = (maxOrder._max.orderIndex || 0) + 1

    // Use transaction to create all questions atomically
    await prisma.$transaction(
      validatedFields.data.map((questionData) => {
        const { skillId, ...rest } = questionData
        // Explicitly map fields to avoid spread issues with types
        return prisma.question.create({
          data: {
            assessmentId,
            skillId,
            questionText: rest.questionText,
            questionType: rest.questionType,
            marks: rest.marks,
            difficultyLevel: rest.difficultyLevel,
            orderIndex: currentOrder++,
            options: rest.options || undefined,
            correctAnswer: rest.correctAnswer,
            // Add any other scalar fields if they exist in schema and schema validation
          } as any,
        })
      })
    )

    revalidatePath(`/admin/assessments/${assessmentId}`)

    return {
      message: `${validatedFields.data.length} questions uploaded successfully`,
      success: true,
    }
  } catch (error) {
    console.error("Bulk upload error:", error)
    return {
      message: "Failed to upload questions",
      success: false,
    }
  }
}

export async function reorderQuestions(
  assessmentId: string,
  questionIds: string[]
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  try {
    // Use transaction to update all orderIndex values
    await prisma.$transaction(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { orderIndex: index + 1 },
        })
      )
    )

    revalidatePath(`/admin/assessments/${assessmentId}`)

    return {
      message: "Questions reordered successfully",
      success: true,
    }
  } catch (error) {
    console.error("Reorder questions error:", error)
    return {
      message: "Failed to reorder questions",
      success: false,
    }
  }
}

// ============================================================================
// QUESTION BANK
// ============================================================================

export async function getQuestionsForBank(params: { skillId?: string; search?: string; excludeAssessmentId?: string }) {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return []
  }

  const { skillId, search, excludeAssessmentId } = params
  const where: any = {}

  // Filter by skill via assessment relation if skillId provided
  if (skillId && skillId !== 'all') {
    where.assessment = {
      skillId
    }
  }

  // Get existing question texts to exclude
  if (excludeAssessmentId) {
    const existingQuestions = await prisma.question.findMany({
      where: { assessmentId: excludeAssessmentId },
      select: { questionText: true }
    })

    const existingTexts = existingQuestions.map(q => q.questionText)

    where.AND = [
      { assessmentId: { not: excludeAssessmentId } }, // Don't show questions from current assessment
      { questionText: { notIn: existingTexts } }      // Don't show questions with same text as current assessment
    ]
  }

  if (search) {
    where.questionText = {
      contains: search,
      mode: 'insensitive'
    }
  }

  try {
    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return questions
  } catch (error) {
    console.error("Get questions for bank error:", error)
    return []
  }
}

export async function importQuestions(
  targetAssessmentId: string,
  questionIds: string[]
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  try {
    // Get max orderIndex
    const maxOrder = await prisma.question.aggregate({
      where: { assessmentId: targetAssessmentId },
      _max: { orderIndex: true },
    })

    let currentOrder = (maxOrder._max.orderIndex || 0) + 1

    // Fetch source questions
    const sourceQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    })

    if (sourceQuestions.length === 0) {
      return { message: "No questions found to import", success: false }
    }

    // Create copies linked to target assessment
    await prisma.$transaction(
      sourceQuestions.map((q) =>
        prisma.question.create({
          data: {
            assessmentId: targetAssessmentId,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options || undefined,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            difficultyLevel: q.difficultyLevel,
            orderIndex: currentOrder++,
            // @ts-ignore - Prisma types are stale in editor
            skillId: (q as any).skillId
          }
        })
      )
    )

    revalidatePath(`/admin/assessments/${targetAssessmentId}`)

    return {
      message: `${sourceQuestions.length} questions imported successfully`,
      success: true,
    }
  } catch (error) {
    console.error("Import questions error:", error)
    return {
      message: "Failed to import questions",
      success: false,
    }
  }
}

// ============================================================================
// ASSESSMENT TAKING
// ============================================================================

export async function startAssessment(assessmentId: string): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.id) {
    return { message: "Unauthorized", success: false }
  }

  try {
    // Get assessment duration
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { duration: true }
    })

    if (!assessment) {
      return { message: "Assessment not found", success: false }
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        userId: session.user.id,
        status: "in_progress",
      },
    })

    if (existingAttempt) {
      // Check if expired
      const startTime = new Date(existingAttempt.startedAt).getTime()
      const endTime = startTime + assessment.duration * 60 * 1000
      const now = Date.now()

      if (now > endTime) {
        // Expired - mark as incomplete/timeout
        await prisma.assessmentAttempt.update({
          where: { id: existingAttempt.id },
          data: { status: "completed", score: 0 } // Or TIMEOUT if enum allows
        })
        // Proceed to create NEW attempt below
      } else {
        return {
          message: "Resuming existing attempt",
          success: true,
          data: { attemptId: existingAttempt.id },
        }
      }
    }

    // Create new attempt
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        userId: session.user.id,
        status: "in_progress",
        startedAt: new Date(),
      },
    })

    return {
      message: "Assessment started successfully",
      success: true,
      data: { attemptId: attempt.id, startedAt: attempt.startedAt },
    }
  } catch (error) {
    console.error("Start assessment error:", error)
    return {
      message: "Failed to start assessment",
      success: false,
    }
  }
}

export async function saveProgress(
  attemptId: string,
  answers: { questionId: string; answerText: string }[]
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.id) {
    return { message: "Unauthorized", success: false }
  }

  // Verify attempt ownership
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { userId: true },
  })

  if (!attempt || attempt.userId !== session.user.id) {
    return { message: "Unauthorized", success: false }
  }

  try {
    // Save all answers - use sequential processing
    for (const answer of answers) {
      // Check if answer exists
      const existing = await prisma.answer.findFirst({
        where: {
          attemptId,
          questionId: answer.questionId,
        },
      })

      if (existing) {
        // Update existing answer
        await prisma.answer.update({
          where: { id: existing.id },
          data: { answerText: answer.answerText },
        })
      } else {
        // Create new answer
        await prisma.answer.create({
          data: {
            attemptId,
            questionId: answer.questionId,
            answerText: answer.answerText,
          },
        })
      }
    }

    return {
      message: "Progress saved successfully",
      success: true,
    }
  } catch (error) {
    console.error("Save progress error:", error)
    return {
      message: "Failed to save progress",
      success: false,
    }
  }
}

export async function submitAssessment(attemptId: string): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.id) {
    return { message: "Unauthorized", success: false }
  }

  try {
    // Fetch attempt with answers and questions
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          include: { question: true },
        },
        assessment: true,
      },
    })

    if (!attempt) {
      return { message: "Attempt not found", success: false }
    }

    if (attempt.userId !== session.user.id) {
      return { message: "Unauthorized", success: false }
    }

    let totalScore = 0
    let hasDescriptive = false

    // Auto-grade objective questions
    const answerUpdates = attempt.answers.map((answer) => {
      const question = answer.question

      if (question.questionType === "DESCRIPTIVE") {
        hasDescriptive = true
        return prisma.answer.update({
          where: { id: answer.id },
          data: {
            isCorrect: null,
            marksAwarded: null,
          },
        })
      }

      let isCorrect = false
      let marksAwarded = 0

      if (question.questionType === "MCQ" || question.questionType === "TRUE_FALSE") {
        isCorrect = answer.answerText.trim() === question.correctAnswer?.trim()
        marksAwarded = isCorrect ? question.marks : 0
      } else if (question.questionType === "FILL_BLANK") {
        // Normalize and compare
        const userAnswer = answer.answerText.trim().toLowerCase()
        const correctAnswer = question.correctAnswer?.trim().toLowerCase()
        isCorrect = userAnswer === correctAnswer
        marksAwarded = isCorrect ? question.marks : 0
      }

      totalScore += marksAwarded

      return prisma.answer.update({
        where: { id: answer.id },
        data: {
          isCorrect,
          marksAwarded,
        },
      })
    })

    await prisma.$transaction(answerUpdates)

    // Update attempt
    const percentage = (totalScore / attempt.assessment.totalMarks) * 100

    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        percentage,
        status: hasDescriptive ? "grading" : "completed",
        completedAt: new Date(),
      },
    })

    revalidatePath("/employee/assessments")

    return {
      message: hasDescriptive
        ? "Assessment submitted. Awaiting grading for descriptive questions."
        : "Assessment completed successfully",
      success: true,
      data: { score: totalScore, percentage, status: hasDescriptive ? "grading" : "completed" },
    }
  } catch (error) {
    console.error("Submit assessment error:", error)
    return {
      message: "Failed to submit assessment",
      success: false,
    }
  }
}

export async function getAttemptById(attemptId: string) {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  try {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            skill: true,
            questions: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        user: true,
      },
    })

    if (!attempt) return null

    // Check ownership or permissions
    const isOwner = attempt.userId === session.user.id
    const isAdminOrTrainer = session.user.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))

    if (!isOwner && !isAdminOrTrainer) {
      return null
    }

    return attempt
  } catch (error) {
    console.error("Get attempt error:", error)
    return null
  }
}

// ============================================================================
// MANUAL GRADING
// ============================================================================

export async function getPendingGrading(params?: {
  assessmentId?: string
  userId?: string
  page?: number
  limit?: number
}) {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { attempts: [], total: 0 }
  }

  const { assessmentId, userId, page = 1, limit = 10 } = params || {}
  const skip = (page - 1) * limit

  const where: any = { status: "grading" }
  if (assessmentId) where.assessmentId = assessmentId
  if (userId) where.userId = userId

  try {
    const [attempts, total] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where,
        include: {
          user: true,
          assessment: {
            include: { skill: true },
          },
          answers: {
            where: {
              question: {
                questionType: "DESCRIPTIVE",
              },
              marksAwarded: null,
            },
          },
        },
        orderBy: { completedAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.assessmentAttempt.count({ where }),
    ])

    return { attempts, total, pages: Math.ceil(total / limit) }
  } catch (error) {
    console.error("Get pending grading error:", error)
    return { attempts: [], total: 0, pages: 0 }
  }
}

export async function gradeAnswer(
  answerId: string,
  marksAwarded: number,
  trainerFeedback?: string
): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  const validatedFields = gradingSchema.safeParse({
    answerId,
    marksAwarded,
    trainerFeedback,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed",
      success: false,
    }
  }

  try {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        attempt: {
          select: { status: true }
        }
      },
    })

    if (!answer) {
      return { message: "Answer not found", success: false }
    }

    if (answer.attempt.status !== "grading") {
      return { message: "Attempt is not in grading status", success: false }
    }

    // Validate marks don't exceed question marks
    if (validatedFields.data.marksAwarded > answer.question.marks) {
      return {
        message: `Marks awarded cannot exceed ${answer.question.marks}`,
        success: false,
      }
    }

    await prisma.answer.update({
      where: { id: answerId },
      data: {
        marksAwarded: validatedFields.data.marksAwarded,
        trainerFeedback: validatedFields.data.trainerFeedback,
        isCorrect: validatedFields.data.marksAwarded === answer.question.marks,
      },
    })

    return {
      message: "Answer graded successfully",
      success: true,
    }
  } catch (error) {
    console.error("Grade answer error:", error)
    return {
      message: "Failed to grade answer",
      success: false,
    }
  }
}

export async function completeGrading(attemptId: string): Promise<FormState> {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    return { message: "Unauthorized", success: false }
  }

  try {
    // Fetch attempt with all answers
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        assessment: true,
      },
    })

    if (!attempt) {
      return { message: "Attempt not found", success: false }
    }

    // Check if all descriptive questions are graded
    const ungradedCount = attempt.answers.filter(
      (a) => a.marksAwarded === null
    ).length

    if (ungradedCount > 0) {
      return {
        message: `${ungradedCount} answer(s) still need grading`,
        success: false,
      }
    }

    // Recalculate total score
    const totalScore = attempt.answers.reduce(
      (sum, answer) => sum + (answer.marksAwarded || 0),
      0
    )

    const percentage = (totalScore / attempt.assessment.totalMarks) * 100

    // Update attempt
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        percentage,
        status: "completed",
      },
    })

    // Update or create SkillMatrix record
    const passed = percentage >= attempt.assessment.passingScore

    if (passed) {
      const currentLevel =
        percentage >= 90
          ? "EXPERT"
          : percentage >= 75
            ? "ADVANCED"
            : percentage >= 60
              ? "INTERMEDIATE"
              : "BEGINNER"

      await prisma.skillMatrix.upsert({
        where: {
          userId_skillId: {
            userId: attempt.userId,
            skillId: attempt.assessment.skillId,
          },
        },
        update: {
          currentLevel,
          lastAssessedDate: new Date(),
          status: "completed",
        },
        create: {
          userId: attempt.userId,
          skillId: attempt.assessment.skillId,
          currentLevel,
          desiredLevel: "EXPERT",
          lastAssessedDate: new Date(),
          status: "completed",
        },
      })

      // Recalculate skill gaps after assessment completion
      try {
        const { updateSkillMatrixGaps } = await import('./skill-matrix')
        await updateSkillMatrixGaps(attempt.userId)
      } catch (gapError) {
        console.error('Failed to update skill matrix gaps:', gapError)
        // Continue - gap update failure shouldn't fail grading
      }
    }

    revalidatePath("/trainer/grading")
    revalidatePath("/employee/assessments")
    revalidatePath("/employee/skill-gaps")

    return {
      message: "Grading completed successfully",
      success: true,
    }
  } catch (error) {
    console.error("Complete grading error:", error)
    return {
      message: "Failed to complete grading",
      success: false,
    }
  }
}

  // ============================================================================
  // ASSESSMENT ASSIGNMENT
  // ============================================================================

  export async function assignAssessment(
    assessmentId: string,
    userIds: string[],
    dueDate?: Date
  ): Promise<FormState> {
    const session = await auth()

    if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
      return { message: "Unauthorized", success: false }
    }

    try {
      // Verify assigner exists in DB to prevent FK violation
      const assigner = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      if (!assigner) {
        return { message: "Assigning user not found in database", success: false }
      }

      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
      })

      if (!assessment) {
        return { message: "Assessment not found", success: false }
      }

      const operations = userIds.map(userId =>
        prisma.assessmentAssignment.upsert({
          where: {
            assessmentId_userId: {
              assessmentId,
              userId
            }
          },
          update: {
            assignedById: assigner.id,
            dueDate: dueDate || undefined,
          },
          create: {
            assessmentId,
            userId,
            assignedById: assigner.id,
            dueDate,
            status: "PENDING"
          }
        })
      )

      await prisma.$transaction(operations)

      revalidatePath(`/admin/assessments/${assessmentId}`)

      return {
        message: `Assessment assigned to ${userIds.length} users successfully`,
        success: true,
      }
    } catch (error) {
      console.error("Assign assessment error:", error)
      return {
        message: "Failed to assign assessment",
        success: false,
      }
    }
  }

  export async function unassignAssessment(assessmentId: string, userId: string): Promise<FormState> {
    const session = await auth()

    if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
      return { message: "Unauthorized", success: false }
    }

    try {
      await prisma.assessmentAssignment.delete({
        where: {
          assessmentId_userId: {
            assessmentId,
            userId
          }
        }
      })

      revalidatePath(`/admin/assessments/${assessmentId}`)
      return { message: "User unassigned successfully", success: true }
    } catch (error) {
      return { message: "Failed to unassign user", success: false }
    }
  }

  export async function getAssignedUsers(assessmentId: string) {
    const session = await auth()

    if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
      return []
    }

    try {
      const assignments = await prisma.assessmentAssignment.findMany({
        where: { assessmentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              designation: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      })
      return assignments
    } catch (error) {
      return []
    }
  }

  export async function getAssessmentSubmissionStatuses(assessmentId: string) {
    const session = await auth()

    if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
      return []
    }

    try {
      // Get all assignments with user and attempt data
      const assignments = await prisma.assessmentAssignment.findMany({
        where: { assessmentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              designation: true
            }
          },
          assessment: {
            select: {
              totalMarks: true,
              questions: {
                select: {
                  id: true,
                  questionType: true
                }
              }
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      })

      // Get attempts for all assigned users
      const userIds = assignments.map(a => a.userId)
      const attempts = await prisma.assessmentAttempt.findMany({
        where: {
          assessmentId,
          userId: { in: userIds }
        },
        include: {
          answers: {
            include: {
              question: {
                select: {
                  questionType: true
                }
              }
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      })

      // Map attempts to users (get latest attempt per user)
      const attemptsMap = new Map()
      attempts.forEach(attempt => {
        if (!attemptsMap.has(attempt.userId)) {
          attemptsMap.set(attempt.userId, attempt)
        }
      })

      // Build status data
      const statuses = assignments.map(assignment => {
        const attempt = attemptsMap.get(assignment.userId)
        
        let status: "NOT_ATTEMPTED" | "IN_PROGRESS" | "COMPLETED" | "NEEDS_GRADING" = "NOT_ATTEMPTED"
        let score: number | null = null
        let percentage: number | null = null
        let startedAt: Date | null = null
        let completedAt: Date | null = null
        let descriptiveQuestionsCount = 0
        let gradedQuestionsCount = 0
        let attemptId: string | null = null

        if (attempt) {
          attemptId = attempt.id
          startedAt = attempt.startedAt
          completedAt = attempt.completedAt
          score = attempt.score
          percentage = attempt.percentage

          if (attempt.status === "in_progress") {
            status = "IN_PROGRESS"
          } else if (attempt.status === "completed" || attempt.status === "grading") {
            // Count descriptive questions and how many are graded
            const descriptiveAnswers = attempt.answers.filter(
              a => a.question.questionType === "DESCRIPTIVE"
            )
            descriptiveQuestionsCount = descriptiveAnswers.length
            gradedQuestionsCount = descriptiveAnswers.filter(
              a => a.marksAwarded !== null
            ).length

            if (descriptiveQuestionsCount > gradedQuestionsCount) {
              status = "NEEDS_GRADING"
            } else {
              status = "COMPLETED"
            }
          }
        }

        return {
          userId: assignment.userId,
          assignmentId: assignment.id,
          user: assignment.user,
          assignedAt: assignment.assignedAt,
          dueDate: assignment.dueDate,
          status,
          attemptId,
          attempt: attempt ? {
            score,
            percentage,
            startedAt,
            completedAt,
            descriptiveQuestionsCount,
            gradedQuestionsCount,
            totalQuestions: assignment.assessment.questions.length,
            answeredQuestions: attempt.answers.length
          } : null
        }
      })

      return statuses
    } catch (error) {
      console.error("Get submission statuses error:", error)
      return []
    }
  }
