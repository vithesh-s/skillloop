import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RiArrowLeftLine } from "@remixicon/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GradeForm } from "@/components/dashboard/assessments/GradeForm"

export default async function AttemptGradePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER', 'MENTOR'].includes(role))) {
    redirect("/unauthorized")
  }

  const { id } = await params

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          designation: true
        }
      },
      assessment: {
        select: {
          id: true,
          title: true,
          totalMarks: true,
          skill: {
            select: {
              name: true
            }
          }
        }
      },
      answers: {
        where: {
          question: {
            questionType: "DESCRIPTIVE"
          }
        },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              correctAnswer: true,
              marks: true,
              difficultyLevel: true,
              orderIndex: true
            }
          }
        },
        orderBy: {
          question: {
            orderIndex: 'asc'
          }
        }
      }
    }
  })

  if (!attempt) {
    notFound()
  }

  const initials = attempt.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || attempt.user.email[0].toUpperCase()

  const ungradedCount = attempt.answers.filter(a => a.marksAwarded === null).length
  const gradedCount = attempt.answers.length - ungradedCount

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/assessments/${attempt.assessment.id}`}>
            <Button variant="ghost" size="icon">
              <RiArrowLeftLine className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Grade Assessment</h1>
            <p className="text-muted-foreground">{attempt.assessment.title}</p>
          </div>
        </div>
        <Link href={`/admin/attempts/${attempt.id}/review`}>
          <Button variant="outline">View All Answers</Button>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Learner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={attempt.user.avatar || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{attempt.user.name || attempt.user.email}</p>
                <p className="text-sm text-muted-foreground">{attempt.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Grading Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {gradedCount} / {attempt.answers.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {ungradedCount} questions pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{attempt.status.toUpperCase()}</Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : "In Progress"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Grading Forms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Descriptive Questions</h2>
          {ungradedCount === 0 && (
            <Badge className="bg-green-600">All Questions Graded ✓</Badge>
          )}
        </div>

        {attempt.answers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No descriptive questions in this assessment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {attempt.answers.map((answer, index) => (
              <GradeForm
                key={answer.id}
                answer={answer}
                attemptId={attempt.id}
                questionNumber={index + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
