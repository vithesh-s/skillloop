"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { saveProgress, submitAssessment } from "@/actions/assessments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RiTimeLine, RiAlertLine, RiSaveLine } from "@remixicon/react"
import { toast } from "sonner"

interface Question {
  id: string
  questionText: string
  questionType: "MCQ" | "DESCRIPTIVE" | "TRUE_FALSE" | "FILL_BLANK"
  options?: any
  marks: number
  difficultyLevel: string
}

interface Assessment {
  id: string
  title: string
  duration: number
  questions: Question[]
  totalMarks: number
}

interface Answer {
  questionId: string
  answerText: string
}

interface AssessmentTakingInterfaceProps {
  assessment: Assessment
  attemptId: string
  existingAnswers: Answer[]
  startedAt: Date
}

export function AssessmentTakingInterface({
  assessment,
  attemptId,
  existingAnswers,
  startedAt,
}: AssessmentTakingInterfaceProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  
  // Calculate end time once - this is the "source of truth"
  const endTimeRef = useRef<number>(0)
  const answersRef = useRef(answers)
  const isSubmittingRef = useRef(false)
  
  // Keep ref in sync with state
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Initialize answers from existing
  useEffect(() => {
    const answerMap: Record<string, string> = {}
    existingAnswers.forEach((answer) => {
      answerMap[answer.questionId] = answer.answerText
    })
    setAnswers(answerMap)
  }, [existingAnswers])

  // Initialize end time ONCE - this is the key to accuracy
  useEffect(() => {
    const startTime = new Date(startedAt).getTime()
    endTimeRef.current = startTime + assessment.duration * 60 * 1000
    
    // Set initial time remaining
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((endTimeRef.current - now) / 1000))
    setTimeRemaining(remaining)
  }, [assessment.duration, startedAt])

  // Memoized submit handler to prevent stale closures
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (isSubmittingRef.current) return
    
    if (!autoSubmit) {
      setShowSubmitDialog(true)
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      // Save final answers using current ref value
      const answerArray = Object.entries(answersRef.current).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      }))

      if (answerArray.length > 0) {
        await saveProgress(attemptId, answerArray)
      }

      // Submit assessment
      const result = await submitAssessment(attemptId)

      if (result.success) {
        toast.success(result.message || "Assessment submitted successfully")
        router.push(`/employee/assessments/${assessment.id}`)
      } else {
        toast.error(result.message || "Failed to submit assessment")
        isSubmittingRef.current = false
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Failed to submit assessment")
      isSubmittingRef.current = false
      setIsSubmitting(false)
    } finally {
      setShowSubmitDialog(false)
    }
  }, [attemptId, assessment.id, router])

  // Timer countdown - RECALCULATE from end time every second (accurate method)
  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate time remaining from the fixed end time (not decrementing)
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((endTimeRef.current - now) / 1000))
      
      setTimeRemaining(remaining)
      
      // Auto-submit when time runs out
      if (remaining === 0 && !isSubmittingRef.current) {
        clearInterval(interval)
        toast.warning("Time's up! Submitting your assessment...")
        handleSubmit(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [handleSubmit])

  // Auto-save with proper cleanup and dependency
  const handleAutoSave = useCallback(async () => {
    if (Object.keys(answersRef.current).length === 0 || isSubmittingRef.current) return

    setIsSaving(true)
    try {
      const answerArray = Object.entries(answersRef.current).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      }))

      const result = await saveProgress(attemptId, answerArray)
      
      if (result.success) {
        setLastSavedAt(new Date())
      }
    } catch (error) {
      console.error("Auto-save error:", error)
      // Silently fail auto-save, don't disrupt user
    } finally {
      setIsSaving(false)
    }
  }, [attemptId])

  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSave()
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(interval)
  }, [handleAutoSave])

  // Manual save handler
  const handleManualSave = async () => {
    await handleAutoSave()
    toast.success("Progress saved")
  }

  // Prevent accidental page close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmittingRef.current && Object.keys(answersRef.current).length > 0) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const parseOptions = useCallback((options: any): string[] => {
    if (Array.isArray(options)) return options
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }, [])

  // Safeguard against invalid index
  const safeCurrentQuestionIndex = Math.min(
    Math.max(0, currentQuestionIndex),
    assessment.questions.length - 1
  )
  
  const currentQuestion = assessment.questions[safeCurrentQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const progress = assessment.questions.length > 0 
    ? (answeredCount / assessment.questions.length) * 100 
    : 0
  const currentOptions = parseOptions(currentQuestion?.options)

  // Early return if no questions
  if (!assessment.questions || assessment.questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No questions available for this assessment.</p>
        </CardContent>
      </Card>
    )
  }

  // Early return if no current question
  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Question not found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Timer and Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{assessment.title}</CardTitle>
              <CardDescription>
                Question {safeCurrentQuestionIndex + 1} of {assessment.questions.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isSaving && <RiSaveLine className="h-4 w-4 animate-pulse text-muted-foreground" />}
                {lastSavedAt && !isSaving && (
                  <span className="text-xs text-muted-foreground">
                    Saved {new Date(lastSavedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <Badge 
                variant={timeRemaining < 300 ? "destructive" : "secondary"}
                className="flex items-center gap-2 px-3 py-1 text-base"
              >
                <RiTimeLine className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentQuestion.questionType.replace('_', ' ')}</Badge>
                <Badge variant="secondary">{currentQuestion.marks} marks</Badge>
                <Badge variant="outline">{currentQuestion.difficultyLevel}</Badge>
              </div>
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.questionText}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Content */}
          <div className="space-y-4">
            {/* MCQ */}
            {currentQuestion.questionType === "MCQ" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => {
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: value,
                  }))
                }}
              >
                <div className="space-y-3">
                  {currentOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option} 
                        id={`mcq-${currentQuestion.id}-option-${index}`} 
                      />
                      <Label
                        htmlFor={`mcq-${currentQuestion.id}-option-${index}`}
                        className="font-normal cursor-pointer flex-1"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {/* TRUE_FALSE */}
            {currentQuestion.questionType === "TRUE_FALSE" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => {
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: value,
                  }))
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="true" 
                      id={`tf-${currentQuestion.id}-true`} 
                    />
                    <Label 
                      htmlFor={`tf-${currentQuestion.id}-true`} 
                      className="font-normal cursor-pointer"
                    >
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="false" 
                      id={`tf-${currentQuestion.id}-false`} 
                    />
                    <Label 
                      htmlFor={`tf-${currentQuestion.id}-false`} 
                      className="font-normal cursor-pointer"
                    >
                      False
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {/* FILL_BLANK */}
            {currentQuestion.questionType === "FILL_BLANK" && (
              <Input
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => {
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: e.target.value,
                  }))
                }}
                placeholder="Enter your answer"
                className="max-w-md"
              />
            )}

            {/* DESCRIPTIVE */}
            {currentQuestion.questionType === "DESCRIPTIVE" && (
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => {
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: e.target.value,
                  }))
                }}
                placeholder="Type your answer here..."
                className="min-h-[200px]"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0 || isSubmitting}
            >
              Previous
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {answeredCount} of {assessment.questions.length} answered
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={isSaving || isSubmitting}
              >
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
            </div>

            {safeCurrentQuestionIndex === assessment.questions.length - 1 ? (
              <Button 
                onClick={() => handleSubmit(false)} 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(assessment.questions.length - 1, prev + 1)
                  )
                }
                disabled={isSubmitting}
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Navigator</CardTitle>
          <CardDescription>
            Click on any question number to jump to that question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {assessment.questions.map((question: Question, index: number) => {
              const isAnswered = Boolean(answers[question.id])
              const isCurrent = index === safeCurrentQuestionIndex
              
              return (
                <Button
                  key={question.id}
                  variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(index)}
                  disabled={isSubmitting}
                  className="w-full"
                  title={`Question ${index + 1} - ${isAnswered ? 'Answered' : 'Not answered'}`}
                >
                  {index + 1}
                </Button>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-primary bg-primary" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 bg-secondary" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2" />
              <span>Not Answered</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Time Warning */}
      {timeRemaining > 0 && timeRemaining < 300 && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-4">
            <RiAlertLine className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium">
              Less than 5 minutes remaining! Your assessment will auto-submit when time runs out.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this assessment? You won&apos;t be able to change your
              answers after submission.
              <br />
              <br />
              You have answered {answeredCount} out of {assessment.questions.length} questions.
              {answeredCount < assessment.questions.length && (
                <>
                  <br />
                  <span className="text-destructive font-medium">
                    {assessment.questions.length - answeredCount} question(s) remain unanswered.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleSubmit(true)} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
