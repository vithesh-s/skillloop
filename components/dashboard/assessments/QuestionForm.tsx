"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { addQuestion } from "@/actions/assessments"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RiAddLine, RiDeleteBinLine, RiInformationLine } from "@remixicon/react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import type { Skill, SkillCategory } from "@prisma/client"

type SkillWithCategory = Skill & { category: SkillCategory }

interface QuestionFormProps {
  assessmentId: string
  skills: SkillWithCategory[]
  defaultSkillId?: string
  onSuccess?: () => void
}

const initialState = {
  message: "",
  errors: {},
  success: false,
}

export function QuestionForm({ assessmentId, skills, defaultSkillId, onSuccess }: QuestionFormProps) {
  const [questionType, setQuestionType] = useState<string>("MCQ")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0)
  const [marks, setMarks] = useState<string>("5") // Default for MCQ

  const [state, formAction, pending] = useActionState(
    addQuestion.bind(null, assessmentId),
    initialState
  )

  // Reset form on success
  useEffect(() => {
    if (state.success) {
      setQuestionType("MCQ")
      setOptions(["", ""])
      setCorrectAnswerIndex(0)
      setMarks("1") // Reset to MCQ default
      if (onSuccess) onSuccess()
    }
  }, [state.success])

  // Update marks when question type changes
  useEffect(() => {
    switch (questionType) {
      case "MCQ":
        setMarks("1")
        break
      case "FILL_BLANK":
        setMarks("1")
        break
      case "TRUE_FALSE":
        setMarks("1")
        break
      case "DESCRIPTIVE":
        setMarks("20")
        break
      default:
        setMarks("1")
    }
  }, [questionType])

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
    <form action={formAction} className="space-y-6">
      {state.message && (
        <Alert variant={state.success ? "default" : "destructive"}>
          <AlertDescription>
            <p>{state.message}</p>
            {!state.success && state.errors && (
               <ul className="list-disc pl-4 mt-2 text-sm">
                 {Object.entries(state.errors).map(([key, errors]) => (
                   <li key={key}>
                     <span className="font-semibold capitalize">{key}:</span> {errors.join(", ")}
                   </li>
                 ))}
               </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

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
        {state.errors?.questionType && (
          <p className="text-sm text-destructive">{state.errors.questionType[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="skillId">Skill*</Label>
        <Select name="skillId" defaultValue={defaultSkillId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a skill" />
          </SelectTrigger>
          <SelectContent>
            {skills.map((skill) => (
              <SelectItem key={skill.id} value={skill.id}>
                {skill.name} ({skill.category.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="questionText">Question Text*</Label>
        <Textarea
          id="questionText"
          name="questionText"
          placeholder="Enter your question here..."
          rows={3}
          required
        />
        {state.errors?.questionText && (
          <p className="text-sm text-destructive">{state.errors.questionText[0]}</p>
        )}
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
          <RadioGroup name="correctAnswer" defaultValue="true" required>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
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
            placeholder="Enter the correct answer"
            required
          />
          <p className="text-sm text-muted-foreground">
            Answers will be matched case-insensitively
          </p>
        </div>
      )}

      {questionType === "DESCRIPTIVE" && (
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50/50">
            <RiInformationLine className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Descriptive questions will require manual grading by a trainer. You can provide a model answer below for reference.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="correctAnswer">Model Answer (Optional)</Label>
            <Textarea
              id="correctAnswer"
              name="correctAnswer"
              placeholder="Enter key points or a model answer for evaluators..."
              rows={4}
            />
          </div>
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
          {state.errors?.marks && (
            <p className="text-sm text-destructive">{state.errors.marks[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficultyLevel">Difficulty Level*</Label>
          <Select name="difficultyLevel" defaultValue="BEGINNER" required>
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

      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add Question"}
      </Button>
    </form>
  )
}
