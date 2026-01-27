import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { CreateAssessmentForm } from '@/components/dashboard/assessments/CreateAssessmentForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface CreateAssessmentPageProps {
  params: Promise<{ trainingId: string }>
}

export default async function CreateAssessmentPage({ params }: CreateAssessmentPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { trainingId } = await params

  // Fetch the training and verify ownership
  const training = await prisma.training.findFirst({
    where: {
      id: trainingId,
      assessmentOwnerId: session.user.id
    },
    select: {
      id: true,
      topicName: true,
      mode: true,
      skillId: true,
      skill: {
        select: {
          id: true,
          name: true,
          category: {
            select: {
              name: true
            }
          }
        }
      },
      creator: {
        select: {
          name: true,
          email: true
        }
      },
      assignments: {
        select: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    }
  })

  if (!training) {
    redirect('/employee/assessment-duties')
  }

  // Check if an assessment already exists for this skill
  const existingAssessment = await prisma.assessment.findFirst({
    where: {
      createdById: session.user.id,
      skillId: training.skillId
    },
    select: {
      id: true,
      status: true,
      title: true
    }
  })

  // If assessment exists, redirect to edit it
  if (existingAssessment) {
    if (existingAssessment.status === 'DRAFT') {
      redirect(`/employee/assessment-duties/${existingAssessment.id}/edit`)
    } else if (existingAssessment.status === 'PUBLISHED') {
      redirect('/employee/assessment-duties?message=assessment-already-published')
    }
  }

  // Fetch skills for dropdown
  const skills = await prisma.skill.findMany({
    include: {
      category: true,
    },
    orderBy: { name: 'asc' }
  })

  const assignedNames = training.assignments.map(a => a.user.name || a.user.email).join(', ')

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
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Create Assessment</h1>
          <p className="text-muted-foreground">
            Create a new skill assessment with questions
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm text-muted-foreground">Assigned To:</span>
          <p className="font-medium text-base mt-1">{assignedNames || 'No one assigned yet'}</p>
        </div>
      </div>

      <CreateAssessmentForm 
        skills={skills}
        basePath="/employee/assessment-duties"
        initialTitle={training.topicName}
        preselectedSkillId={training.skillId}
      />
    </div>
  )
}
