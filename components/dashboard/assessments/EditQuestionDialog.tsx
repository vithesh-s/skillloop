"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { type FormState, updateQuestion } from "@/actions/assessments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Question {
  id: string
  questionText: string
  questionType: string
  options?: string[]
  correctAnswer?: string
  marks: number
  difficultyLevel: string
  skillId: string
}

interface EditQuestionDialogProps {
  question: Question
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const initialState: FormState = {
  message: "",
  errors: {},
  success: false,
}

export function EditQuestionDialog({ question, open, onOpenChange, onSuccess }: EditQuestionDialogProps) {
  const [questionType, setQuestionType] = useState<string>(question.questionType)
  const [options, setOptions] = useState<string[]>(question.options || ["", ""])
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0)
  const [marks, setMarks] = useState<string>(question.marks.toString())
  const [questionText, setQuestionText] = useState<string>(question.questionText)
  const [correctAnswer, setCorrectAnswer] = useState<string>(question.correctAnswer || "")
  const [difficultyLevel, setDifficultyLevel] = useState<string>(question.difficultyLevel)

  // Find correct answer index for MCQ
  useEffect(() => {
    if (question.questionType === "MCQ" && question.options && question.correctAnswer) {
      const index = question.options.findIndex(opt => opt === question.correctAnswer)
      if (index >= 0) setCorrectAnswerIndex(index)
    }
  }, [question])

  // Wrapper for the update action to preserve correct typing
  const updateQuestionAction = async (state: FormState, payload: FormData) => {
    return updateQuestion(question.id, state, payload);
  };

  const [state, formAction, pending] = useActionState(
    updateQuestionAction,
    initialState
  )

  // Handle success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
      if (onSuccess) onSuccess()
    }
  }, [state.success])

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
      if (correctAnswerIndex >= index) {
        setCorrectAnswerIndex(Math.max(0, correctAnswerIndex - 1))
      }
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>
            Modify the question details below.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-6">
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertDescription>
                <p>{state.message}</p>
                {state.errors && (
                  <ul className="list-disc pl-4 mt-2 text-sm">
                    {Object.entries(state.errors).map(([key, errors]) => (
                      <li key={key}>
                        <span className="font-semibold capitalize">{key}:</span> {(errors as string[]).join(", ")}
                      </li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          <input type="hidden" name="skillId" value={question.skillId} />

          <div className="space-y-2">
            <Label htmlFor="questionType">Question Type*</Label>
            <Select
              name="questionType"
              value={questionType}
              onValueChange={setQuestionType}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
                <SelectItem value="DESCRIPTIVE">Descriptive</SelectItem>
                <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                <SelectItem value="FILL_BLANK">Fill in the Blank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionText">Question Text*</Label>
            <Textarea
              id="questionText"
              name="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              rows={3}
              required
            />
          </div>

          {questionType === "MCQ" && (
            <div className="space-y-2">
              <Label>Options*</Label>
              <RadioGroup value={correctAnswerIndex.toString()}>
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={index.toString()}
                      onClick={() => setCorrectAnswerIndex(index)}
                    />
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <RiDeleteBinLine className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </RadioGroup>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <RiAddLine className="mr-2 h-4 w-4" />
                Add Option
              </Button>
              <input type="hidden" name="options" value={JSON.stringify(options)} />
              <input type="hidden" name="correctAnswer" value={options[correctAnswerIndex]} />
            </div>
          )}

          {questionType === "TRUE_FALSE" && (
            <div className="space-y-2">
              <Label>Correct Answer*</Label>
              <RadioGroup 
                name="correctAnswer" 
                value={correctAnswer}
                onValueChange={setCorrectAnswer}
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="edit-true" />
                  <Label htmlFor="edit-true" className="cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="edit-false" />
                  <Label htmlFor="edit-false" className="cursor-pointer">False</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {questionType === "FILL_BLANK" && (
            <div className="space-y-2">
              <Label htmlFor="correctAnswer">Correct Answer*</Label>
              <Input
                id="correctAnswer"
                name="correctAnswer"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Enter the correct answer"
                required
              />
            </div>
          )}

          {questionType === "DESCRIPTIVE" && (
            <div className="space-y-2">
              <Label htmlFor="correctAnswer">Model Answer (Optional)</Label>
              <Textarea
                id="correctAnswer"
                name="correctAnswer"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Enter key points or a model answer for evaluators..."
                rows={4}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marks">Marks*</Label>
              <Input
                id="marks"
                name="marks"
                type="number"
                min="1"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficultyLevel">Difficulty Level*</Label>
              <Select 
                name="difficultyLevel" 
                value={difficultyLevel}
                onValueChange={setDifficultyLevel}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
