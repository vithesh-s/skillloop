import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getAssessmentById } from "@/actions/assessments"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RiEditLine, RiArrowLeftLine, RiFileTextLine, RiTimeLine, RiBarChartBoxLine } from "@remixicon/react"
import { QuestionsList } from "@/components/dashboard/assessments/QuestionsList"
import { AssessmentAssignmentManager } from "@/components/dashboard/assessments/AssessmentAssignmentManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
    redirect("/unauthorized")
  }

  const { id } = await params
  const assessment = await getAssessmentById(id)

  if (!assessment) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>
      case "PUBLISHED":
        return <Badge variant="default">Published</Badge>
      case "ARCHIVED":
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/assessments">
            <Button variant="ghost" size="icon">
              <RiArrowLeftLine className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{assessment.title}</h1>
            <p className="text-muted-foreground">{assessment.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(assessment.status)}
          <Link href={`/admin/assessments/${assessment.id}/edit`}>
            <Button>
              <RiEditLine className="mr-2 h-4 w-4" />
              Edit Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <RiFileTextLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment._count.questions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Marks</CardTitle>
            <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment.totalMarks}</div>
            <p className="text-xs text-muted-foreground">Passing: {assessment.passingScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <RiTimeLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment.duration}</div>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attempts</CardTitle>
            <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment._count.attempts}</div>
            <p className="text-xs text-muted-foreground">total submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Skill</p>
              <p className="text-base">{assessment.skill.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <Badge variant="outline">
                {assessment.isPreAssessment ? "Pre-Assessment" : "Post-Assessment"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-base">{assessment.creator.name || assessment.creator.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-base">{new Date(assessment.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="space-y-4 mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Questions</h2>
            <p className="text-muted-foreground">
              Manage the questions for this assessment
            </p>
          </div>
          <QuestionsList
            assessmentId={assessment.id}
          />
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4 mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Learner Assignments</h2>
            <p className="text-muted-foreground">
              Manage which learners are assigned to this assessment
            </p>
          </div>
          <AssessmentAssignmentManager assessmentId={assessment.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
