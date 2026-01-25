import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAssessmentById, startAssessment } from "@/actions/assessments"
import { prisma } from "@/lib/prisma"
import { AssessmentTakingInterface } from "@/components/dashboard/assessments/AssessmentTakingInterface"
import { AssessmentResults } from "@/components/dashboard/assessments/AssessmentResults"

export default async function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const resolvedParams = await params

  if (!session?.user?.id) {
    redirect("/login")
  }

  const assessment = await getAssessmentById(resolvedParams.id)

  if (!assessment || assessment.status !== "PUBLISHED") {
    redirect("/employee/assessments")
  }

  // Check for existing attempt
  const existingAttempt = await prisma.assessmentAttempt.findFirst({
    where: {
      assessmentId: resolvedParams.id,
      userId: session.user.id,
    },
    orderBy: { startedAt: "desc" },
    include: {
      answers: {
        include: { question: true },
      },
    },
  })

  // If completed or grading, show results
  if (existingAttempt && (existingAttempt.status === "completed" || existingAttempt.status === "grading")) {
    return <AssessmentResults attemptId={existingAttempt.id} />
  }

  // If in progress, resume/continue
  if (existingAttempt && existingAttempt.status === "in_progress") {
    return (
      <AssessmentTakingInterface
        assessment={assessment}
        attemptId={existingAttempt.id}
        existingAnswers={existingAttempt.answers}
        startedAt={existingAttempt.startedAt}
      />
    )
  }

  // Start new attempt
  const result = await startAssessment(resolvedParams.id)
  
  if (!result.success || !result.data?.attemptId) {
    redirect("/employee/assessments")
  }

  return (
    <AssessmentTakingInterface
      assessment={assessment}
      attemptId={result.data.attemptId}
      existingAnswers={[]}
      startedAt={result.data.startedAt}
    />
  )
}
