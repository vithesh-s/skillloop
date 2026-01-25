"use client"

import { useState } from "react"
import { bulkUploadQuestions } from "@/actions/assessments"
import { useRouter } from "next/navigation"
import { parseQuestionCSV, generateQuestionTemplate, validateQuestionRow } from "@/lib/csv-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RiDownloadLine, RiUploadLine } from "@remixicon/react"

interface BulkUploadQuestionsProps {
  assessmentId: string
}

export function BulkUploadQuestions({ assessmentId }: BulkUploadQuestionsProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const downloadTemplate = () => {
    const template = generateQuestionTemplate()
    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "questions_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setErrors([])
    setPreview([])
    setSuccess(false)

    try {
      const questions = await parseQuestionCSV(selectedFile)
      
      // Validate each question
      const validationErrors: string[] = []
      questions.forEach((q, index) => {
        const result = validateQuestionRow(q)
        if (!result.success) {
          validationErrors.push(`Row ${index + 2}: ${result.error}`)
        }
      })

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
      } else {
        setPreview(questions)
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Failed to parse CSV"])
    }
  }

  const router = useRouter()

  const handleUpload = async () => {
    if (preview.length === 0) return

    setLoading(true)
    setErrors([])

    try {
      const result = await bulkUploadQuestions(assessmentId, preview)
      
      if (result.success) {
        setSuccess(true)
        setFile(null)
        setPreview([])
        setTimeout(() => {
          setSuccess(false)
          router.refresh()
        }, 2000)
      } else {
        setErrors([result.message || "Failed to upload questions"])
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Upload failed"])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">CSV File Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload questions in bulk using CSV format
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <RiDownloadLine className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csvFile">Select CSV File</Label>
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <p className="font-semibold">Validation Errors:</p>
              <ul className="list-disc pl-4 mt-2">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>
              Questions uploaded successfully! Reloading...
            </AlertDescription>
          </Alert>
        )}
      </div>

      {preview.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Preview ({preview.length} questions)</h3>
            <Button onClick={handleUpload} disabled={loading}>
              <RiUploadLine className="mr-2 h-4 w-4" />
              {loading ? "Uploading..." : "Upload Questions"}
            </Button>
          </div>

          <div className="border rounded-lg overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((question, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {question.questionText}
                    </TableCell>
                    <TableCell>{question.questionType}</TableCell>
                    <TableCell>{question.marks}</TableCell>
                    <TableCell>{question.difficultyLevel}</TableCell>
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
