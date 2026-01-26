import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AssessmentCard } from "@/components/dashboard/assessments/AssessmentCard"

export default async function EmployeeAssessmentsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch published assessments
  const assessments = await prisma.assessment.findMany({
    where: { 
      status: "PUBLISHED",
      assignments: {
        some: {
          userId: session.user.id
        }
      }
    },
    include: {
      skill: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Fetch user's attempts
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId: session.user.id },
    include: {
      assessment: true,
    },
  })

  const attemptsByAssessment = attempts.reduce((acc, attempt) => {
    if (!acc[attempt.assessmentId] || new Date(attempt.startedAt) > new Date(acc[attempt.assessmentId].startedAt)) {
      acc[attempt.assessmentId] = attempt
    }
    return acc
  }, {} as Record<string, any>)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Assessments</h1>
        <p className="text-muted-foreground">
          Take skill assessments to evaluate your knowledge
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assessments.map((assessment) => {
          const attempt = attemptsByAssessment[assessment.id]
          const actionLabel = attempt
            ? attempt.status === "in_progress"
              ? "Resume Assessment"
              : "View Results"
            : "Start Assessment"

          return (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              actionLabel={actionLabel}
              href={`/employee/assessments/${assessment.id}`}
            />
          )
        })}
      </div>

      {assessments.length === 0 && (
        <p className="text-center py-12 text-muted-foreground">
          No assessments available at this time
        </p>
      )}
    </div>
  )
}
