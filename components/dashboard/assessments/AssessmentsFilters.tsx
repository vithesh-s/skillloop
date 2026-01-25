"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Skill } from "@prisma/client"

interface AssessmentsFiltersProps {
  skills: Skill[]
}

export function AssessmentsFilters({ skills }: AssessmentsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "ALL") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // Reset to page 1 on filter change
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 space-y-2">
        <Label>Search</Label>
        <Input
          placeholder="Search assessments..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => {
            const timer = setTimeout(() => {
              updateFilter("search", e.target.value)
            }, 500)
            return () => clearTimeout(timer)
          }}
        />
      </div>

      <div className="w-full sm:w-48 space-y-2">
        <Label>Status</Label>
        <Select
          defaultValue={searchParams.get("status") || "ALL"}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-48 space-y-2">
        <Label>Skill</Label>
        <Select
          defaultValue={searchParams.get("skill") || ""}
          onValueChange={(value) => updateFilter("skill", value === "ALL" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Skills</SelectItem>
            {skills.map((skill) => (
              <SelectItem key={skill.id} value={skill.id}>
                {skill.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-48 space-y-2">
        <Label>Type</Label>
        <Select
          defaultValue={searchParams.get("type") || "ALL"}
          onValueChange={(value) => {
            if (value === "ALL") {
              updateFilter("isPreAssessment", "")
            } else if (value === "PRE") {
              updateFilter("isPreAssessment", "true")
            } else {
              updateFilter("isPreAssessment", "false")
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PRE">Pre-Assessment</SelectItem>
            <SelectItem value="POST">Post-Assessment</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
