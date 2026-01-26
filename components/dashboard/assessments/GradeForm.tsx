"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface GradeFormProps {
  answer: {
    id: string
    answerText: string
    marksAwarded: number | null
    trainerFeedback: string | null
    question: {
      id: string
      questionText: string
      questionType: string
      marks: number
      difficultyLevel: string
      correctAnswer: string | null
    }
  }
  attemptId: string
  questionNumber: number
}

export function GradeForm({ answer, attemptId, questionNumber }: GradeFormProps) {
  const [marks, setMarks] = useState<string>(answer.marksAwarded?.toString() || "")
  const [feedback, setFeedback] = useState(answer.trainerFeedback || "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const marksNum = parseFloat(marks)
    if (isNaN(marksNum) || marksNum < 0 || marksNum > answer.question.marks) {
      toast.error(`Marks must be between 0 and ${answer.question.marks}`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/grade-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerId: answer.id,
          marksAwarded: marksNum,
          feedback: feedback.trim() || null,
          attemptId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success("Answer graded successfully")
        router.refresh()
      } else {
        toast.error(result.message || "Failed to grade answer")
      }
    } catch (error) {
      toast.error("Failed to submit grade")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Question {questionNumber}</Badge>
              <Badge variant="secondary">{answer.question.questionType}</Badge>
              <Badge>{answer.question.difficultyLevel}</Badge>
              {answer.marksAwarded !== null && (
                <Badge className="bg-green-600">Graded</Badge>
              )}
            </div>
            <p className="text-base font-medium">{answer.question.questionText}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Max: {answer.question.marks} marks</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User's Answer */}
        <div>
          <Label className="text-sm font-medium">Learner's Answer:</Label>
          <div className="mt-1 p-3 rounded bg-muted/50 min-h-20">
            <p className="text-sm whitespace-pre-wrap">{answer.answerText || "No answer provided"}</p>
          </div>
        </div>

        {/* Suggested Answer (if available) */}
        {answer.question.correctAnswer && (
          <div>
            <Label className="text-sm font-medium">Suggested Answer / Reference:</Label>
            <div className="mt-1 p-3 rounded bg-blue-50 border border-blue-200">
              <p className="text-sm whitespace-pre-wrap">{answer.question.correctAnswer}</p>
            </div>
          </div>
        )}

        {/* Grading Form */}
        <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`marks-${answer.id}`}>
                Marks Awarded <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`marks-${answer.id}`}
                type="number"
                min="0"
                max={answer.question.marks}
                step="0.5"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder={`0 - ${answer.question.marks}`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`feedback-${answer.id}`}>Feedback (Optional)</Label>
            <Textarea
              id={`feedback-${answer.id}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback to help the learner improve..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : answer.marksAwarded !== null ? "Update Grade" : "Submit Grade"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
