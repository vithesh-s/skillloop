"use client"

import { useState, useRef } from "react"
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
import { RiDownloadLine, RiUploadLine, RiCloseLine, RiFileTextLine } from "@remixicon/react"

interface BulkUploadQuestionsProps {
  assessmentId: string
  skillId: string
  onSuccess?: () => void
}

export function BulkUploadQuestions({ assessmentId, skillId, onSuccess }: BulkUploadQuestionsProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    console.log('[BulkUpload] File selected:', selectedFile.name)
    setFile(selectedFile)
    setErrors([])
    setPreview([])
    setSuccess(false)
    setParsing(true)

    try {
      console.log('[BulkUpload] Parsing CSV...')
      const questions = await parseQuestionCSV(selectedFile)
      console.log('[BulkUpload] Parsed questions:', questions.length)
      
      // Add skillId to each question
      const questionsWithSkill = questions.map(q => ({ ...q, skillId }))
      console.log('[BulkUpload] Added skillId to questions:', skillId)
      
      // Validate each question
      const validationErrors: string[] = []
      questionsWithSkill.forEach((q, index) => {
        const result = validateQuestionRow(q)
        if (!result.success) {
          console.log(`[BulkUpload] Validation error on row ${index + 2}:`, result.error)
          validationErrors.push(`Row ${index + 2}: ${result.error}`)
        }
      })

      if (validationErrors.length > 0) {
        console.log('[BulkUpload] Validation errors:', validationErrors.length)
        setErrors(validationErrors)
      } else {
        console.log('[BulkUpload] All questions valid, setting preview')
        setPreview(questionsWithSkill)
      }
    } catch (error) {
      console.error('[BulkUpload] Parse error:', error)
      setErrors([error instanceof Error ? error.message : "Failed to parse CSV"])
    } finally {
      setParsing(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setParsing(false)
    setPreview([])
    setErrors([])
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        
        // Call parent callback to refresh questions list
        onSuccess?.()
        router.refresh()
        
        setTimeout(() => {
          setSuccess(false)
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

        <div className="space-y-3">
          <Label>Select CSV File</Label>
          {!file ? (
            <div className="relative">
              <input
                ref={fileInputRef}
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="csvFile"
                className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
              >
                <div className="text-center">
                  <RiUploadLine className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Click to upload CSV file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or drag and drop your file here
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <RiFileTextLine className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="shrink-0"
              >
                <RiCloseLine className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {parsing && (
          <Alert>
            <AlertDescription>
              Parsing CSV file and validating questions...
            </AlertDescription>
          </Alert>
        )}

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
