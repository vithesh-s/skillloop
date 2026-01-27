"use client"

import { useEffect, useState } from "react"
import { getAssessmentById, deleteQuestion, reorderQuestions } from "@/actions/assessments"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RiDeleteBinLine, RiDraggable, RiEditLine } from "@remixicon/react"
import { QuestionTypeIcon } from "./QuestionTypeIcon"
import { EditQuestionDialog } from "./EditQuestionDialog"

interface QuestionsListProps {
  assessmentId: string
  lastUpdate?: number
}

export function QuestionsList({ assessmentId, lastUpdate }: QuestionsListProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [assessmentId, lastUpdate])

  const [targetTotal, setTargetTotal] = useState(0)

  const loadQuestions = async () => {
    setLoading(true)
    const assessment = await getAssessmentById(assessmentId)
    if (assessment) {
      setQuestions(assessment.questions || [])
      setTargetTotal(assessment.totalMarks)
    }
    setLoading(false)
  }

  const currentTotal = questions.reduce((sum: number, q: { marks: number }) => sum + q.marks, 0)
  const isOverLimit = currentTotal > targetTotal
  const isUnderLimit = currentTotal < targetTotal

  const handleDelete = async (questionId: string) => {
    const result = await deleteQuestion(questionId)
    if (result.success) {
      loadQuestions()
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData("text/html"))

    if (dragIndex === dropIndex) return

    const newQuestions = [...questions]
    const [draggedItem] = newQuestions.splice(dragIndex, 1)
    newQuestions.splice(dropIndex, 0, draggedItem)

    setQuestions(newQuestions)

    // Update order in backend
    await reorderQuestions(
      assessmentId,
      newQuestions.map(q => q.id)
    )
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-500"
      case "INTERMEDIATE":
        return "bg-blue-500"
      case "ADVANCED":
        return "bg-orange-500"
      case "EXPERT":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading questions...</p>
  }

  if (questions.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No questions added yet. Add your first question above.
      </p>
    )
  }

  return (
    <>
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border ${isOverLimit ? 'bg-destructive/10 border-destructive text-destructive' : isUnderLimit ? 'bg-yellow-500/10 border-yellow-500 text-yellow-700' : 'bg-green-500/10 border-green-500 text-green-700'}`}>
        <div className="flex justify-between items-center font-medium">
          <span>Target Score: {targetTotal}</span>
          <span>Current Score: {currentTotal}</span>
        </div>
        <div className="text-sm mt-1">
          {isOverLimit 
            ? `You have exceeded the target score by ${currentTotal - targetTotal} marks.` 
            : isUnderLimit 
              ? `You need ${targetTotal - currentTotal} more marks to reach the target.`
              : "Perfect! Current score matches the target."
          }
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {questions.length} question{questions.length !== 1 ? "s" : ""} added. Drag to reorder.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead className="w-8">#</TableHead>
            <TableHead>Question</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Marks</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question, index) => (
            <TableRow
              key={question.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="cursor-move"
            >
              <TableCell>
                <RiDraggable className="h-4 w-4 text-muted-foreground" />
              </TableCell>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {question.questionText.substring(0, 80)}
                {question.questionText.length > 80 && "..."}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <QuestionTypeIcon type={question.questionType} />
                  <span className="text-sm">{question.questionType}</span>
                </div>
              </TableCell>
              <TableCell>{question.marks}</TableCell>
              <TableCell>
                <Badge className={getDifficultyColor(question.difficultyLevel)}>
                  {question.difficultyLevel}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setEditingQuestion(question)}
                >
                  <RiEditLine className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <RiDeleteBinLine className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the question.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(question.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

      {editingQuestion && (
        <EditQuestionDialog
          question={editingQuestion}
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          onSuccess={loadQuestions}
        />
      )}
    </>
  )
}
