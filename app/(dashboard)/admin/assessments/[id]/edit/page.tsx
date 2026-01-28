import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CreateAssessmentForm } from "@/components/dashboard/assessments/CreateAssessmentForm"
import { getAssessmentById } from "@/actions/assessments"

export default async function EditAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const resolvedParams = await params


  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER', 'MENTOR'].includes(role))) {
    redirect("/unauthorized")
  }

  const [assessment, skills] = await Promise.all([
    getAssessmentById(resolvedParams.id),
    prisma.skill.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!assessment) {
    redirect("/admin/assessments")
  }

  // If assessment is already published, redirect to view
  if (assessment.status === "PUBLISHED" || assessment.status === "ARCHIVED") {
    redirect(`/admin/assessments/${resolvedParams.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Assessment</h1>
        <p className="text-muted-foreground">
          Manage questions and settings for "{assessment.title}"
        </p>
      </div>

      <CreateAssessmentForm 
        skills={skills} 
        initialAssessment={assessment}
      />
    </div>
  )
}
