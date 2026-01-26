"use client"

import { useState, useMemo } from "react"
import { AssignmentStatusCard } from "./AssignmentStatusCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RiSearchLine } from "@remixicon/react"

interface AssignmentStatusGridProps {
  data: Array<{
    userId: string
    assignmentId: string
    user: {
      id: string
      name: string | null
      email: string
      avatar: string | null
      designation: string | null
    }
    assignedAt: Date
    dueDate: Date | null
    status: "NOT_ATTEMPTED" | "IN_PROGRESS" | "COMPLETED" | "NEEDS_GRADING"
    attemptId: string | null
    attempt: {
      score: number | null
      percentage: number | null
      startedAt: Date | null
      completedAt: Date | null
      descriptiveQuestionsCount: number
      gradedQuestionsCount: number
      totalQuestions: number
      answeredQuestions: number
    } | null
  }>
}

export function AssignmentStatusGrid({ data }: AssignmentStatusGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Calculate summary statistics
  const stats = useMemo(() => {
    return {
      total: data.length,
      notAttempted: data.filter(d => d.status === "NOT_ATTEMPTED").length,
      inProgress: data.filter(d => d.status === "IN_PROGRESS").length,
      completed: data.filter(d => d.status === "COMPLETED").length,
      needsGrading: data.filter(d => d.status === "NEEDS_GRADING").length,
    }
  }, [data])

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const name = item.user.name?.toLowerCase() || ""
        const email = item.user.email.toLowerCase()
        const designation = item.user.designation?.toLowerCase() || ""
        
        return name.includes(search) || email.includes(search) || designation.includes(search)
      }

      return true
    })
  }, [data, searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Assigned</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.notAttempted}</div>
            <p className="text-xs text-muted-foreground">Not Attempted</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.needsGrading}</div>
            <p className="text-xs text-muted-foreground">Needs Grading</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, email, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-full sm:w-50">
          <Label htmlFor="status" className="sr-only">Filter by status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="NOT_ATTEMPTED">Not Attempted</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="NEEDS_GRADING">Needs Grading</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} assignments
        </p>
      </div>

      {/* Cards Grid */}
      {filteredData.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredData.map((item) => (
            <AssignmentStatusCard key={item.assignmentId} data={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {data.length === 0 
                ? "No assignments yet. Assign this assessment to learners first."
                : "No assignments match your filters."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
