import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RiArrowLeftLine, RiCheckLine, RiCloseLine } from "@remixicon/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function AttemptReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER'].includes(role))) {
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
          passingScore: true,
          skill: {
            select: {
              name: true
            }
          }
        }
      },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              options: true,
              correctAnswer: true,
              marks: true,
              difficultyLevel: true
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

  const hasUngradedDescriptive = attempt.answers.some(
    a => a.question.questionType === "DESCRIPTIVE" && a.marksAwarded === null
  )

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
            <h1 className="text-3xl font-bold">Attempt Review</h1>
            <p className="text-muted-foreground">{attempt.assessment.title}</p>
          </div>
        </div>
        {hasUngradedDescriptive && (
          <Link href={`/admin/attempts/${attempt.id}/grade`}>
            <Button>Grade Now</Button>
          </Link>
        )}
      </div>

      {/* User & Score Info */}
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
            <CardTitle className="text-sm font-medium">Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {attempt.score !== null ? attempt.score : "Pending"} / {attempt.assessment.totalMarks}
            </div>
            {attempt.percentage !== null && (
              <p className="text-sm text-muted-foreground">
                {attempt.percentage.toFixed(1)}% (Pass: {attempt.assessment.passingScore}%)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={attempt.status === "completed" ? "default" : "secondary"}>
                {attempt.status.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Completed: {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Questions & Answers */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Questions & Answers</h2>
        
        {attempt.answers.map((answer, index) => (
          <Card key={answer.id} className={answer.isCorrect === false ? "border-l-4 border-l-destructive" : answer.isCorrect === true ? "border-l-4 border-l-green-600" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Question {index + 1}</Badge>
                    <Badge variant="secondary">{answer.question.questionType}</Badge>
                    <Badge>{answer.question.difficultyLevel}</Badge>
                  </div>
                  <p className="text-base font-medium">{answer.question.questionText}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {answer.marksAwarded !== null ? answer.marksAwarded : "?"} / {answer.question.marks}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Options for MCQ */}
              {answer.question.questionType === "MCQ" && answer.question.options && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Options:</p>
                  <div className="space-y-1">
                    {(answer.question.options as string[]).map((option, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded ${
                          option === answer.question.correctAnswer
                            ? "bg-green-50 border border-green-200"
                            : option === answer.answerText
                            ? "bg-red-50 border border-red-200"
                            : "bg-muted/50"
                        }`}
                      >
                        {option === answer.question.correctAnswer && (
                          <RiCheckLine className="h-4 w-4 text-green-600" />
                        )}
                        {option === answer.answerText && option !== answer.question.correctAnswer && (
                          <RiCloseLine className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User's Answer */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</p>
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-sm">{answer.answerText || "No answer provided"}</p>
                </div>
              </div>

              {/* Correct Answer */}
              {answer.question.correctAnswer && answer.question.questionType !== "DESCRIPTIVE" && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Correct Answer:</p>
                  <div className="p-3 rounded bg-green-50 border border-green-200">
                    <p className="text-sm">{answer.question.correctAnswer}</p>
                  </div>
                </div>
              )}

              {/* Trainer Feedback */}
              {answer.trainerFeedback && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Trainer Feedback:</p>
                  <div className="p-3 rounded bg-blue-50 border border-blue-200">
                    <p className="text-sm">{answer.trainerFeedback}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
