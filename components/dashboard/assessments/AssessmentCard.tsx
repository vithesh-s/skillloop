import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RiTimeLine, RiFileListLine } from "@remixicon/react"
import type { Assessment, Skill } from "@prisma/client"
import Link from 'next/link'

interface AssessmentCardProps {
  assessment: Assessment & { skill: Skill }
  actionLabel: string
  href: string
}

export function AssessmentCard({ assessment, actionLabel, href }: AssessmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-500"
      case "DRAFT":
        return "bg-gray-500"
      case "ARCHIVED":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  const getAssessmentTypeColor = (isPreAssessment: boolean) => {
    return isPreAssessment ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{assessment.title}</CardTitle>
            <CardDescription className="line-clamp-2 h-10">{assessment.description}</CardDescription>
          </div>
          <Badge className={getStatusColor(assessment.status)}>
            {assessment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline">{assessment.skill.name}</Badge>
            <div className="flex items-center gap-1">
              <RiTimeLine className="h-4 w-4" />
              <span>{assessment.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <RiFileListLine className="h-4 w-4" />
              <span>{assessment.totalMarks} marks</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Passing Score: </span>
              <span className="font-medium">{assessment.passingScore}%</span>
            </div>
            <Badge className={getAssessmentTypeColor(assessment.isPreAssessment)}>
              {assessment.isPreAssessment ? "Pre-Assessment" : "Post-Assessment"}
            </Badge>
          </div>
        </div>

        <Button asChild className="w-full">
          <Link href={href}>
            {actionLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
