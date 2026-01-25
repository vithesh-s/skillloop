import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAttemptById } from "@/actions/assessments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GradingInterface } from "@/components/dashboard/trainer/GradingInterface"
import { RiTimeLine, RiUserLine } from "@remixicon/react"

export default async function GradingDetailPage({
  params,
}: {
  params: { attemptId: string }
}) {
  const session = await auth()
  if (!session?.user || !session.user.systemRoles?.includes("TRAINER")) {
    redirect("/unauthorized")
  }

  const attempt = await getAttemptById(params.attemptId)

  if (!attempt || attempt.status !== "grading") {
    redirect("/trainer/grading")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grade Assessment</h1>
        <p className="text-muted-foreground">
          Review and grade descriptive questions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{attempt.assessment.title}</CardTitle>
              <CardDescription>{attempt.assessment.skill.name}</CardDescription>
            </div>
            <Badge variant="outline">Grading in Progress</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Learner</p>
              <p className="flex items-center gap-2">
                <RiUserLine className="h-4 w-4" />
                {attempt.user.name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Marks</p>
              <p className="font-bold">{attempt.assessment.totalMarks}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="flex items-center gap-2">
                <RiTimeLine className="h-4 w-4" />
                {attempt.assessment.duration} min
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completed At</p>
              <p>{new Date(attempt.completedAt!).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <GradingInterface attemptId={params.attemptId} />
    </div>
  )
}
