"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { createAssessment, updateAssessment, addQuestion, publishAssessment, getAssessmentById } from "@/actions/assessments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QuestionForm } from "./QuestionForm"
import { QuestionsList } from "./QuestionsList"
import { BulkUploadQuestions } from "./BulkUploadQuestions"
import { QuestionBankSelector } from "./QuestionBankSelector"
import { useRouter } from "next/navigation"
import type { Skill, SkillCategory } from "@prisma/client"

type SkillWithCategory = Skill & { category: SkillCategory }

interface CreateAssessmentFormProps {
  skills: SkillWithCategory[]
  initialAssessment?: any
  basePath?: string
  initialTitle?: string
  preselectedSkillId?: string
}

const initialState = {
  message: "",
  errors: {},
  success: false,
}

export function CreateAssessmentForm({ 
  skills, 
  initialAssessment, 
  basePath = '/admin/assessments',
  initialTitle,
  preselectedSkillId 
}: CreateAssessmentFormProps) {
  const [step, setStep] = useState(initialAssessment ? 2 : 1)
  const [assessmentId, setAssessmentId] = useState<string | null>(initialAssessment?.id || null)
  const [isPreAssessment, setIsPreAssessment] = useState(initialAssessment?.isPreAssessment || false)
  const [lastUpdate, setLastUpdate] = useState(0)
  const [currentTotal, setCurrentTotal] = useState(0)
  const [targetTotal, setTargetTotal] = useState(initialAssessment?.totalMarks || 0)
  const [questionCount, setQuestionCount] = useState(initialAssessment?.questions?.length || 0)
  const router = useRouter()

  const handleUpdate = () => {
    setLastUpdate(prev => prev + 1)
    router.refresh()
  }

  // Fetch assessment data to calculate totals
  useEffect(() => {
    if (assessmentId) {
      const fetchAssessment = async () => {
        const data = await getAssessmentById(assessmentId)
        if (data) {
          const total = data.questions?.reduce((sum: number, q: any) => sum + q.marks, 0) || 0
          setCurrentTotal(total)
          setTargetTotal(data.totalMarks)
          setQuestionCount(data.questions?.length || 0)
        }
      }
      fetchAssessment()
    }
  }, [assessmentId, lastUpdate])

  const [state, formAction, pending] = useActionState(
    initialAssessment 
      ? updateAssessment.bind(null, initialAssessment.id) 
      : createAssessment, 
    initialState
  )

  // Handle assessment creation success
  useEffect(() => {
    if (state.success && state.data?.assessmentId && !assessmentId) {
      // Redirect to edit page to prevent state loss on refresh/navigation
      router.push(`${basePath}/${state.data.assessmentId}/edit`)
    }
  }, [state, assessmentId, router])

  const handlePublish = async () => {
    if (!assessmentId) return

    const result = await publishAssessment(assessmentId)
    if (result.success) {
      router.push(basePath)
    }
  }

  if (step === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>
            Enter the basic information for your assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {state.message && !state.success && (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Assessment Title*</Label>
              <Input
                id="title"
                name="title"
                defaultValue={initialAssessment?.title || initialTitle}
                placeholder="e.g., React Fundamentals Assessment"
                required
              />
              {state.errors?.title && (
                <p className="text-sm text-destructive">{state.errors.title[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={initialAssessment?.description}
                placeholder="Brief description of this assessment..."
                rows={3}
              />
              {state.errors?.description && (
                <p className="text-sm text-destructive">{state.errors.description[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillId">Skill*</Label>
              <Select name="skillId" defaultValue={initialAssessment?.skillId || preselectedSkillId} required>
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
              {state.errors?.skillId && (
                <p className="text-sm text-destructive">{state.errors.skillId[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks*</Label>
                <Input
                  id="totalMarks"
                  name="totalMarks"
                  type="number"
                  min="1"
                  defaultValue={initialAssessment?.totalMarks}
                  placeholder="100"
                  required
                />
                {state.errors?.totalMarks && (
                  <p className="text-sm text-destructive">{state.errors.totalMarks[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score (%)*</Label>
                <Input
                  id="passingScore"
                  name="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={initialAssessment?.passingScore}
                  placeholder="70"
                  required
                />
                {state.errors?.passingScore && (
                  <p className="text-sm text-destructive">{state.errors.passingScore[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)*</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  defaultValue={initialAssessment?.duration}
                  placeholder="60"
                  required
                />
                {state.errors?.duration && (
                  <p className="text-sm text-destructive">{state.errors.duration[0]}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input type="hidden" name="isPreAssessment" value={isPreAssessment ? "true" : "false"} />
              <Switch
                id="isPreAssessment"
                checked={isPreAssessment}
                onCheckedChange={setIsPreAssessment}
              />
              <Label htmlFor="isPreAssessment" className="cursor-pointer">
                This is a Pre-Assessment
              </Label>
            </div>

            <Button type="submit" disabled={pending}>
              {pending ? (initialAssessment ? "Updating..." : "Creating...") : (initialAssessment ? "Update & Continue" : "Next: Add Questions")}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (step === 2 && assessmentId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Questions</CardTitle>
            <CardDescription>
              Add questions to your assessment manually or via CSV upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manual">Add Manually</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
                <TabsTrigger value="bank">Question Bank</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="space-y-4">
                <QuestionForm 
                  assessmentId={assessmentId} 
                  skills={skills} 
                  defaultSkillId={initialAssessment?.skillId || (state.success && state.data?.skillId)} 
                  onSuccess={handleUpdate}
                />
              </TabsContent>
              <TabsContent value="bulk">
                <BulkUploadQuestions 
                  assessmentId={assessmentId} 
                  skillId={initialAssessment?.skillId || (state.success && state.data?.skillId) || ''}
                  onSuccess={handleUpdate}
                />
              </TabsContent>
              <TabsContent value="bank">
                 <QuestionBankSelector 
                    assessmentId={assessmentId} 
                    skills={skills}
                    currentSkillId={
                      initialAssessment?.skillId || 
                      (state.success && state.data?.skillId) || 
                      ""
                    } 
                 />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions List</CardTitle>
            <CardDescription>
              Manage and reorder your questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionsList assessmentId={assessmentId} lastUpdate={lastUpdate} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="font-semibold">{questionCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Total Marks:</span>
                <span className={`font-semibold ${currentTotal === targetTotal ? 'text-green-600' : currentTotal > targetTotal ? 'text-red-600' : 'text-orange-600'}`}>
                  {currentTotal} / {targetTotal}
                </span>
              </div>
              {currentTotal !== targetTotal && (
                <Alert variant={currentTotal > targetTotal ? 'destructive' : 'default'}>
                  <AlertDescription>
                    {currentTotal > targetTotal 
                      ? `Total marks exceed target by ${currentTotal - targetTotal}. Remove questions or adjust marks.`
                      : `Need ${targetTotal - currentTotal} more marks to match the target total.`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push(basePath)}>
            Save as Draft
          </Button>
          <div className="flex items-center gap-3">
            {currentTotal !== targetTotal && (
              <span className="text-sm text-muted-foreground">
                Match marks total to publish
              </span>
            )}
            <Button 
              onClick={handlePublish}
              disabled={currentTotal !== targetTotal || questionCount === 0}
            >
              Publish Assessment
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
