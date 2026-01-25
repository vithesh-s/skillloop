"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RiEyeLine } from "@remixicon/react"
import Link from "next/link"

interface PendingGradingTableProps {
  attempts: any[]
}

export function PendingGradingTable({ attempts }: PendingGradingTableProps) {
  if (attempts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No assessments pending grading
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Learner</TableHead>
            <TableHead>Assessment</TableHead>
            <TableHead>Skill</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead>Pending Questions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => {
            const pendingCount = attempt.answers.filter(
              (a: any) => a.isCorrect === null
            ).length

            return (
              <TableRow key={attempt.id}>
                <TableCell className="font-medium">{attempt.user.name}</TableCell>
                <TableCell>{attempt.assessment.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{attempt.assessment.skill.name}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(attempt.completedAt!).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge>{pendingCount} questions</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/trainer/grading/${attempt.id}`}>
                    <Button size="sm" variant="outline">
                      <RiEyeLine className="mr-2 h-4 w-4" />
                      Grade
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
