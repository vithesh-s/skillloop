"use client"

import { useState } from "react"
import { generateAIQuestions } from "@/actions/ai"
import { bulkUploadQuestions } from "@/actions/assessments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RiMagicLine, RiDeleteBinLine, RiLoader4Line } from "@remixicon/react"
import { useRouter } from "next/navigation"

interface AIGenerationFormProps {
  assessmentId: string
  skillName: string
  skillId: string
  onSuccess?: () => void
}

const QUESTION_TYPES = [
  { id: "MCQ", label: "Multiple Choice" },
  { id: "TRUE_FALSE", label: "True/False" },
  { id: "FILL_BLANK", label: "Fill in the Blank" },
  { id: "DESCRIPTIVE", label: "Descriptive" },
]

export function AIGenerationForm({ assessmentId, skillName, skillId, onSuccess }: AIGenerationFormProps) {
  const [topic, setTopic] = useState(skillName)
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState("INTERMEDIATE")
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["MCQ"])
  const [instructions, setInstructions] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type])
    } else {
      setSelectedTypes(selectedTypes.filter(t => t !== type))
    }
  }

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) {
      setError("Please select at least one question type")
      return
    }

    setLoading(true)
    setError(null)
    setPreview([])

    try {
      const result = await generateAIQuestions(topic, count, difficulty, selectedTypes, instructions)
      
      if (result.success && result.data) {
        // success
        setPreview(result.data.map((q: any) => ({ ...q, skillId })))
      } else {
        setError(result.message || "Failed to generate questions")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveQuestion = (index: number) => {
    setPreview(preview.filter((_, i) => i !== index))
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    
    setLoading(true)
    try {
      // Use existing bulk upload action
      const result = await bulkUploadQuestions(assessmentId, preview)
      
      if (result.success) {
        setPreview([])
        onSuccess?.()
        router.refresh()
      } else {
        setError(result.message || "Failed to import questions")
      }
    } catch (err) {
      setError("Failed to import questions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic / Skill Context</Label>
            <Input 
              id="topic" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g. React Hooks, Organic Chemistry"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="count">Number of Questions</Label>
              <Input 
                id="count" 
                type="number" 
                min="1" 
                max="20" 
                value={count} 
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  setCount(isNaN(val) ? 0 : val)
                }} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
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

          <div className="space-y-2">
            <Label>Question Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type.id}`} 
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleTypeChange(type.id, checked as boolean)}
                  />
                  <Label htmlFor={`type-${type.id}`} className="font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="instructions">User Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., 'Focus heavily on useEffect', 'Include code snippets in options', 'Avoid negative questions'"
              className="h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Provide specific guidance to the AI to tailor the questions to your needs.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading ? (
          <>
            <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <RiMagicLine className="mr-2 h-4 w-4" />
            Generate Questions with AI
          </>
        )}
      </Button>

      {preview.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Preview ({preview.length})</h3>
            <Button onClick={handleImport} disabled={loading} variant="default">
              Import Questions
            </Button>
          </div>

          <div className="border rounded-md overflow-hidden">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((q, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-xs">{q.questionType}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm line-clamp-2">{q.questionText}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Answer: {q.correctAnswer}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {q.options.map((opt: string, idx: number) => (
                            <span key={idx} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-sm">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{q.difficultyLevel}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(i)}>
                        <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
