"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner" 
import { deleteAssessment, publishAssessment, archiveAssessment } from "@/actions/assessments"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { RiMore2Fill, RiEyeLine, RiEditLine, RiDeleteBinLine, RiSendPlaneLine, RiArchiveLine } from "@remixicon/react"
import { useState } from "react"
import type { Assessment, Skill } from "@prisma/client"

interface AssessmentTableRow extends Assessment {
  skill: Skill
  creator: {
    name: string | null
    email: string
  }
  _count: {
    questions: number
    attempts: number
  }
}

interface AssessmentsTableProps {
  assessments: AssessmentTableRow[]
  currentPage: number
  totalPages: number
}

export function AssessmentsTable({
  assessments,
  currentPage,
  totalPages,
}: AssessmentsTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Guard against undefined assessments
  if (!Array.isArray(assessments)) {
    return <div>Loading assessments...</div>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>
      case "PUBLISHED":
        return <Badge className="bg-green-500">Published</Badge>
      case "ARCHIVED":
        return <Badge variant="destructive">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }


  const handleDelete = async (id: string) => {
    const result = await deleteAssessment(id)
    if (result.success) {
      setDeleteId(null)
      router.refresh()
    } else {
        toast.error(result.message)
    }
  }

  const handleArchive = async (id: string) => {
    const result = await archiveAssessment(id)
    if (result.success) {
      router.refresh()
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const handlePublish = async (id: string) => {
    const result = await publishAssessment(id)
    if (result.success) {
      router.refresh()
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Skill</TableHead>
              <TableHead className="text-center">Questions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-center">Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No assessments found
                </TableCell>
              </TableRow>
            ) : (
              assessments.map((assessment) => (
                <TableRow 
                  key={assessment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/assessments/${assessment.id}`)}
                >
                  <TableCell className="font-medium">{assessment.title}</TableCell>
                  <TableCell>{assessment.skill.name}</TableCell>
                  <TableCell className="text-center">
                    {assessment._count.questions}
                  </TableCell>
                  <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {assessment.isPreAssessment ? "Pre" : "Post"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {assessment.creator.name || assessment.creator.email}
                  </TableCell>
                  <TableCell className="text-center">{assessment.duration} min</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <RiMore2Fill className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/assessments/${assessment.id}`}>
                            <RiEyeLine className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/assessments/${assessment.id}/edit`}>
                            <RiEditLine className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {assessment.status === "DRAFT" && (
                          <>
                            <DropdownMenuItem onClick={() => handlePublish(assessment.id)}>
                                <RiSendPlaneLine className="mr-2 h-4 w-4" />
                                Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteId(assessment.id)}
                                className="text-destructive"
                            >
                                <RiDeleteBinLine className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {assessment.status === "PUBLISHED" && (
                          <DropdownMenuItem onClick={() => handleArchive(assessment.id)}>
                            <RiArchiveLine className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => router.push(`?page=${currentPage - 1}`)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => router.push(`?page=${currentPage + 1}`)}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the assessment.
              (Note: Published assessments can only be archived)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
