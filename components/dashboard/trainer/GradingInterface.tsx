"use client"

import { useEffect, useState, useActionState } from "react"
import { getAttemptById, gradeAnswer, completeGrading } from "@/actions/assessments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface GradingInterfaceProps {
  attemptId: string
}

export function GradingInterface({ attemptId }: GradingInterfaceProps) {
  const router = useRouter()
  const [attempt, setAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0)

  // Form state for each answer
  const [marksAwarded, setMarksAwarded] = useState("")
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    loadAttempt()
  }, [attemptId])

  const loadAttempt = async () => {
    const data = await getAttemptById(attemptId)
    setAttempt(data)
    setLoading(false)

    // Load first pending answer
    if (data) {
      const firstPending = data.answers.findIndex((a: any) => a.isCorrect === null)
      if (firstPending !== -1) {
        setCurrentAnswerIndex(firstPending)
        const answer = data.answers[firstPending]
        setMarksAwarded(answer.marksAwarded?.toString() || "")
        setFeedback(answer.trainerFeedback || "")
      }
    }
  }

  const handleGradeAnswer = async () => {
    const currentAnswer = attempt.answers[currentAnswerIndex]
    const marks = parseFloat(marksAwarded)

    if (isNaN(marks) || marks < 0 || marks > currentAnswer.question.marks) {
      toast.error(`Marks must be between 0 and ${currentAnswer.question.marks}`)
      return
    }

    const result = await gradeAnswer(currentAnswer.id, marks, feedback)

    if (result.success) {
      toast.success("Answer graded successfully")

      // Reload attempt to get updated data
      await loadAttempt()

      // Move to next pending answer
      const nextPending = attempt.answers.findIndex(
        (a: any, index: number) => index > currentAnswerIndex && a.isCorrect === null
      )

      if (nextPending !== -1) {
        setCurrentAnswerIndex(nextPending)
        const answer = attempt.answers[nextPending]
        setMarksAwarded(answer.marksAwarded?.toString() || "")
        setFeedback(answer.trainerFeedback || "")
      } else {
        // No more pending answers, reload to show completion UI
        await loadAttempt()
      }
    } else {
      toast.error(result.message || "Failed to grade answer")
    }
  }

  const handleCompleteGrading = async () => {
    const result = await completeGrading(attemptId)

    if (result.success) {
      toast.success("Grading completed successfully")
      router.push("/trainer/grading")
    } else {
      toast.error(result.message || "Failed to complete grading")
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading grading interface...</div>
  }

  if (!attempt) {
    return <div className="text-center py-12">Attempt not found</div>
  }

  const pendingAnswers = attempt.answers.filter((a: any) => a.isCorrect === null)
  const gradedAnswers = attempt.answers.filter((a: any) => a.isCorrect !== null)

  // If all graded, show completion UI
  if (pendingAnswers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Questions Graded</CardTitle>
          <CardDescription>
            Review the grading summary and complete the assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{attempt.answers.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Graded</p>
              <p className="text-2xl font-bold">{gradedAnswers.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingAnswers.length}</p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full">Complete Grading & Calculate Score</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete Grading</AlertDialogTitle>
                <AlertDialogDescription>
                  This will calculate the final score and update the learner&apos;s skill matrix.
                  The learner will be notified of their results.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCompleteGrading}>
                  Complete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    )
  }

  const currentAnswer = attempt.answers[currentAnswerIndex]

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Grading Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(gradedAnswers.length / attempt.answers.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <Badge>
              {gradedAnswers.length} / {attempt.answers.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Question {currentAnswerIndex + 1}</CardTitle>
              <CardDescription>
                {currentAnswer.question.difficultyLevel} •{" "}
                {currentAnswer.question.marks} marks
              </CardDescription>
            </div>
            <Badge>{currentAnswer.question.questionType}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Question</Label>
            <p className="text-lg">{currentAnswer.question.questionText}</p>
          </div>

          <div className="space-y-2">
            <Label>Learner&apos;s Answer</Label>
            <div className="bg-muted p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{currentAnswer.answerText}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="marks">
                Marks Awarded (Max: {currentAnswer.question.marks})
              </Label>
              <Input
                id="marks"
                type="number"
                min="0"
                max={currentAnswer.question.marks}
                step="0.5"
                value={marksAwarded}
                onChange={(e) => setMarksAwarded(e.target.value)}
                placeholder="Enter marks"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the learner..."
                rows={4}
              />
            </div>

            <Button onClick={handleGradeAnswer} className="w-full">
              {pendingAnswers.length === 1
                ? "Grade & Complete"
                : "Grade & Next Question"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>All Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {attempt.answers.map((answer: any, index: number) => {
              const isGraded = answer.isCorrect !== null
              const isCurrent = index === currentAnswerIndex

              return (
                <Button
                  key={answer.id}
                  variant={isCurrent ? "default" : isGraded ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => {
                    setCurrentAnswerIndex(index)
                    setMarksAwarded(answer.marksAwarded?.toString() || "")
                    setFeedback(answer.trainerFeedback || "")
                  }}
                  className={isGraded ? "bg-green-50 text-green-900" : ""}
                >
                  Q{index + 1}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
