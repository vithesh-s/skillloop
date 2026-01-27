import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { CreateAssessmentForm } from '@/components/dashboard/assessments/CreateAssessmentForm'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface EditAssessmentPageProps {
  params: Promise<{ assessmentId: string }>
}

export default async function EditAssessmentPage({ params }: EditAssessmentPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { assessmentId } = await params

  // Fetch the assessment and verify the user is the creator
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      createdById: session.user.id
    },
    include: {
      skill: {
        include: {
          category: true
        }
      },
      questions: {
        orderBy: { orderIndex: 'asc' }
      },
      _count: {
        select: {
          questions: true
        }
      }
    }
  })

  if (!assessment) {
    redirect('/employee/assessment-duties')
  }

  // Fetch skills for dropdown
  const skills = await prisma.skill.findMany({
    include: {
      category: true,
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/employee">Employee</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/employee/assessment-duties">Assessment Duties</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Assessment</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Edit Assessment</h1>
        <p className="text-muted-foreground">
          Manage your assessment and questions
        </p>
      </div>

      <CreateAssessmentForm 
        skills={skills}
        initialAssessment={assessment}
        basePath="/employee/assessment-duties"
      />
    </div>
  )
}
