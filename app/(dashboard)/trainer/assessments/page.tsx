import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAssessments } from "@/actions/assessments"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RiAddLine } from "@remixicon/react"
import { AssessmentsTable } from "@/components/dashboard/assessments/AssessmentsTable"
import { AssessmentsFilters } from "@/components/dashboard/assessments/AssessmentsFilters"

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; status?: string; page?: string; search?: string }>
}) {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    redirect("/unauthorized")
  }

  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  
  const [assessmentsData, skills] = await Promise.all([
    getAssessments({
      skillId: params.skill,
      status: params.status,
      page,
      limit: 10,
    }),
    prisma.skill.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  const { assessments = [], pages = 1 } = assessmentsData || {}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessments</h1>
          <p className="text-muted-foreground">
            Manage skill assessments and question banks
          </p>
        </div>
        <Link href="/trainer/assessments/create">
          <Button>
            <RiAddLine className="mr-2 h-4 w-4" />
            Create Assessment
          </Button>
        </Link>
      </div>

      <AssessmentsFilters skills={skills} />

      <AssessmentsTable
        assessments={assessments}
        currentPage={page}
        totalPages={pages || 1}
      />
    </div>
  )
}
