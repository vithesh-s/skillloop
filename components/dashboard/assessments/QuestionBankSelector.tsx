"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { importQuestions } from "@/actions/assessments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getQuestionsForBank } from "@/actions/assessments"
import { toast } from "sonner"
import type { Skill, SkillCategory } from "@prisma/client"

type SkillWithCategory = Skill & { category: SkillCategory }

interface QuestionBankSelectorProps {
  assessmentId: string
  currentSkillId: string
  skills: SkillWithCategory[]
}

export function QuestionBankSelector({ assessmentId, currentSkillId, skills }: QuestionBankSelectorProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [skillId, setSkillId] = useState(currentSkillId || "")
  const [importing, setImporting] = useState(false)
  
  // Update local state if prop changes (initial load)
  useEffect(() => {
    if (currentSkillId && !skillId) {
        setSkillId(currentSkillId)
    }
  }, [currentSkillId])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const data = await getQuestionsForBank({ skillId, search, excludeAssessmentId: assessmentId })
      setQuestions(data)
    } catch (error) {
      toast.error("Failed to fetch questions")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions()
    }, 500)
    return () => clearTimeout(timer)
  }, [skillId, search])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(questions.map(q => q.id))
    } else {
      setSelectedQuestions([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, id])
    } else {
      setSelectedQuestions(prev => prev.filter(qId => qId !== id))
    }
  }

  const handleImport = async () => {
    if (selectedQuestions.length === 0) return

    setImporting(true)
    try {
      const result = await importQuestions(assessmentId, selectedQuestions)
      if (result.success) {
        toast.success(result.message)
        setSelectedQuestions([])
        // Ideally trigger a refresh of the questions list here
        window.location.reload() // Simple way to refresh for now
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to import questions")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-[300px]">
          <Label>Filter by Skill</Label>
          <Select 
            value={skillId} 
            onValueChange={setSkillId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {skills.map((skill) => (
                <SelectItem key={skill.id} value={skill.id}>
                  {skill.name} ({skill.category.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label>Search Questions</Label>
          <Input 
            placeholder="Search by text..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={questions.length > 0 && selectedQuestions.length === questions.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Difficulty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading questions...
                </TableCell>
              </TableRow>
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No questions found in the bank for this skill.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={(checked) => handleSelectOne(question.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{question.questionText}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{question.questionType}</Badge>
                  </TableCell>
                  <TableCell>{question.marks}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{question.difficultyLevel}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedQuestions.length} questions selected
        </div>
        <Button onClick={handleImport} disabled={importing || selectedQuestions.length === 0}>
          {importing ? "Importing..." : "Import Selected Questions"}
        </Button>
      </div>
    </div>
  )
}
