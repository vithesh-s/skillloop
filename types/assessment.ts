import { Assessment, Question, AssessmentAttempt, Answer, User, Skill } from '@prisma/client'

export type AssessmentWithQuestions = Assessment & {
    questions: Question[]
    skill: Skill
    _count: { attempts: number; questions: number }
}

export type AttemptWithDetails = AssessmentAttempt & {
    assessment: Assessment & { skill: Skill }
    answers: (Answer & { question: Question })[]
    user: User
}

export type QuestionWithAnswer = Question & {
    answer?: Answer | null
}

export type SkillScore = {
    skillName: string
    score: number
    maxScore: number
    percentage: number
}
