import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CreateAssessmentForm } from "@/components/dashboard/assessments/CreateAssessmentForm"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default async function CreateAssessmentPage() {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    redirect("/unauthorized")
  }

  // Fetch skills for dropdown
  const skills = await prisma.skill.findMany({
    include: {
      category: true,
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/trainer">Trainer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/trainer/assessments">Assessments</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Create Assessment</h1>
        <p className="text-muted-foreground">
          Create a new skill assessment with questions
        </p>
      </div>

      <CreateAssessmentForm skills={skills} />
    </div>
  )
}
