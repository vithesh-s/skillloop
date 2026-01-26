'use client'

import { type SkillGapSummary } from '@/types/skill-matrix'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface TopGapSkillsTableProps {
  topGapSkills: SkillGapSummary[]
}

export function TopGapSkillsTable({ topGapSkills }: TopGapSkillsTableProps) {
  if (topGapSkills.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No gap data available
      </div>
    )
  }

  const getGapColor = (gap: number) => {
    if (gap > 50) return 'text-destructive'
    if (gap > 30) return 'text-orange-500'
    if (gap > 15) return 'text-yellow-500'
    return 'text-blue-500'
  }

  return (
    <div className="max-h-100 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Skill Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Employees Affected</TableHead>
            <TableHead>Avg Gap</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topGapSkills.map((skill, index) => (
            <TableRow key={skill.skillId}>
              <TableCell className="font-medium">
                {index + 1}. {skill.skillName}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{skill.categoryName}</Badge>
              </TableCell>
              <TableCell>{skill.employeesAffected}</TableCell>
              <TableCell>
                <div className="space-y-1 min-w-25">
                  <span className={`font-semibold ${getGapColor(skill.averageGap)}`}>
                    {skill.averageGap.toFixed(1)}%
                  </span>
                  <Progress 
                    value={100 - skill.averageGap} 
                    className="h-2"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
