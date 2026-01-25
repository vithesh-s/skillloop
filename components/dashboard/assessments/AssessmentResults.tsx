"use client"

import { useEffect, useState } from "react"
import { getAttemptById } from "@/actions/assessments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RiCheckLine, RiCloseLine, RiTimeLine } from "@remixicon/react"
import { SkillBreakdownChart } from "./SkillBreakdownChart"
import Link from "next/link"
import type { SkillScore } from "@/types/assessment"

interface AssessmentResultsProps {
  attemptId: string
}

export function AssessmentResults({ attemptId }: AssessmentResultsProps) {
  const [attempt, setAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [attemptId])

  const loadResults = async () => {
    const data = await getAttemptById(attemptId)
    setAttempt(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-12">Loading results...</div>
  }

  if (!attempt) {
    return <div className="text-center py-12">Results not found</div>
  }

  const passed = attempt.percentage >= attempt.assessment.passingScore
  const isPending = attempt.status === "grading"

  // Calculate skill-wise breakdown
  const skillScores: Record<string, SkillScore> = {}
  attempt.answers.forEach((answer: any) => {
    const skillName = attempt.assessment.skill.name
    if (!skillScores[skillName]) {
      skillScores[skillName] = {
        skillName,
        score: 0,
        maxScore: 0,
        percentage: 0,
      }
    }
    skillScores[skillName].score += answer.marksAwarded || 0
    skillScores[skillName].maxScore += answer.question.marks
  })

  Object.values(skillScores).forEach((skill) => {
    skill.percentage = (skill.score / skill.maxScore) * 100
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{attempt.assessment.title}</CardTitle>
              <CardDescription>{attempt.assessment.skill.name}</CardDescription>
            </div>
            {isPending ? (
              <Badge variant="outline" className="text-lg px-4 py-2">
                Pending Grading
              </Badge>
            ) : passed ? (
              <Badge className="bg-green-500 text-lg px-4 py-2">
                <RiCheckLine className="mr-2 h-5 w-5" />
                Passed
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                <RiCloseLine className="mr-2 h-5 w-5" />
                Failed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPending && (
            <Alert>
              <AlertDescription>
                Your assessment includes descriptive questions that require manual grading by a trainer.
                You will be notified once grading is complete.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-2xl font-bold">
                {isPending ? "Pending" : `${attempt.score || 0}/${attempt.assessment.totalMarks}`}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Percentage</p>
              <p className="text-2xl font-bold">
                {isPending ? "Pending" : `${(attempt.percentage || 0).toFixed(1)}%`}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Passing Score</p>
              <p className="text-2xl font-bold">{attempt.assessment.passingScore}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold flex items-center">
                <RiTimeLine className="mr-1 h-5 w-5" />
                {attempt.assessment.duration} min
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Breakdown Chart */}
      {!isPending && <SkillBreakdownChart skillScores={Object.values(skillScores)} />}

      {/* Question by Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>
            Review your answers and see the correct ones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {attempt.answers.map((answer: any, index: number) => {
            const isCorrect = answer.isCorrect
            const isPendingGrade = answer.isCorrect === null

            return (
              <div key={answer.id} className="space-y-3">
                <div className="flex items-start gap-4">
                  <Badge variant={isCorrect ? "default" : isPendingGrade ? "outline" : "destructive"}>
                    {index + 1}
                  </Badge>
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold">{answer.question.questionText}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Your Answer:</p>
                      <p className="text-sm bg-muted p-2 rounded">{answer.answerText}</p>
                    </div>

                    {answer.question.questionType !== "DESCRIPTIVE" && answer.question.correctAnswer && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Correct Answer:</p>
                        <p className="text-sm bg-green-50 text-green-900 p-2 rounded">
                          {answer.question.correctAnswer}
                        </p>
                      </div>
                    )}

                    {answer.trainerFeedback && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Trainer Feedback:</p>
                        <p className="text-sm bg-blue-50 text-blue-900 p-2 rounded">
                          {answer.trainerFeedback}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">
                        {answer.marksAwarded !== null ? answer.marksAwarded : "Pending"} / {answer.question.marks} marks
                      </Badge>
                      <Badge variant="outline">{answer.question.difficultyLevel}</Badge>
                      {isPendingGrade && (
                        <Badge>Awaiting Manual Grading</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {index < attempt.answers.length - 1 && <Separator />}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link href="/employee/assessments">
          <Button>Back to Assessments</Button>
        </Link>
      </div>
    </div>
  )
}
