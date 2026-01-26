import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { RiFileTextLine, RiTimeLine, RiCheckLine, RiAlertLine } from "@remixicon/react"
import Link from "next/link"

interface AssignmentStatusCardProps {
  data: {
    userId: string
    assignmentId: string
    user: {
      id: string
      name: string | null
      email: string
      avatar: string | null
      designation: string | null
    }
    assignedAt: Date
    dueDate: Date | null
    status: "NOT_ATTEMPTED" | "IN_PROGRESS" | "COMPLETED" | "NEEDS_GRADING"
    attemptId: string | null
    attempt: {
      score: number | null
      percentage: number | null
      startedAt: Date | null
      completedAt: Date | null
      descriptiveQuestionsCount: number
      gradedQuestionsCount: number
      totalQuestions: number
      answeredQuestions: number
    } | null
  }
}

export function AssignmentStatusCard({ data }: AssignmentStatusCardProps) {
  const getStatusConfig = () => {
    switch (data.status) {
      case "NOT_ATTEMPTED":
        return {
          badge: <Badge variant="destructive">Not Attempted</Badge>,
          cardClass: "border-l-4 border-l-destructive",
          icon: <RiAlertLine className="h-5 w-5 text-destructive" />
        }
      case "IN_PROGRESS":
        return {
          badge: <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">In Progress</Badge>,
          cardClass: "border-l-4 border-l-yellow-500",
          icon: <RiTimeLine className="h-5 w-5 text-yellow-500" />
        }
      case "COMPLETED":
        return {
          badge: <Badge variant="default" className="bg-green-600 hover:bg-green-700">Completed</Badge>,
          cardClass: "border-l-4 border-l-green-600",
          icon: <RiCheckLine className="h-5 w-5 text-green-600" />
        }
      case "NEEDS_GRADING":
        return {
          badge: <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Needs Grading</Badge>,
          cardClass: "border-l-4 border-l-blue-600",
          icon: <RiFileTextLine className="h-5 w-5 text-blue-600" />
        }
    }
  }

  const config = getStatusConfig()
  const initials = data.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || data.user.email[0].toUpperCase()

  return (
    <Card className={`${config.cardClass} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={data.user.avatar || undefined} alt={data.user.name || data.user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {data.user.name || data.user.email}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{data.user.email}</p>
            {data.user.designation && (
              <p className="text-xs text-muted-foreground">{data.user.designation}</p>
            )}
          </div>
          <div className="shrink-0">
            {config.icon}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 py-3 px-4">
        <div className="flex items-center justify-between">
          {config.badge}
        </div>

        {data.attempt && (
          <>
            {data.status === "IN_PROGRESS" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {data.attempt.answeredQuestions}/{data.attempt.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">
                    {data.attempt.startedAt ? new Date(data.attempt.startedAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            )}

            {(data.status === "COMPLETED" || data.status === "NEEDS_GRADING") && (
              <div className="space-y-1">
                {data.attempt.score !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className="font-bold text-base">
                      {data.attempt.score} ({data.attempt.percentage?.toFixed(1)}%)
                    </span>
                  </div>
                )}
                {data.status === "NEEDS_GRADING" && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium text-blue-600">
                      {data.attempt.descriptiveQuestionsCount - data.attempt.gradedQuestionsCount} questions
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">
                    {data.attempt.completedAt ? new Date(data.attempt.completedAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {!data.attempt && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Assigned</span>
              <span className="font-medium">{new Date(data.assignedAt).toLocaleDateString()}</span>
            </div>
            {data.dueDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">{new Date(data.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-3 px-4 gap-2">
        {data.attemptId && (
          <Link href={`/admin/attempts/${data.attemptId}/review`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">
              View Details
            </Button>
          </Link>
        )}
        {data.status === "NEEDS_GRADING" && data.attemptId && (
          <Link href={`/admin/attempts/${data.attemptId}/grade`} className="flex-1">
            <Button size="sm" className="w-full h-8 text-xs">
              Grade Now
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
