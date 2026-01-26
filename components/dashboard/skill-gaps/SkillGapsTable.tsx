'use client'

import { useState } from 'react'
import { type SkillGapData, GapCategory } from '@/types/skill-matrix'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GapCategoryBadge } from './GapCategoryBadge'
import { RiArrowUpLine, RiArrowDownLine, RiEditLine, RiDeleteBinLine } from '@remixicon/react'
import { format } from 'date-fns'

import { toast } from 'sonner'
import { deleteSkillMatrixEntry } from '@/actions/skill-matrix'

type SortField = 'skillName' | 'gapPercentage' | 'lastAssessed' | 'category'
type SortOrder = 'asc' | 'desc'

interface SkillGapsTableProps {
  skillGaps: SkillGapData[]
  userId: string
}

export function SkillGapsTable({ skillGaps, userId }: SkillGapsTableProps) {
  const [sortField, setSortField] = useState<SortField>('gapPercentage')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleDelete = async (skillId: string) => {
    if (window.confirm("Are you sure you want to remove this skill from your matrix?")) {
      try {
        await deleteSkillMatrixEntry(userId, skillId)
        toast.success("Skill removed successfully")
      } catch (error) {
        toast.error("Failed to remove skill")
      }
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedGaps = [...skillGaps].sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortField) {
      case 'skillName':
        aValue = a.skillName.toLowerCase()
        bValue = b.skillName.toLowerCase()
        break
      case 'gapPercentage':
        aValue = a.gapPercentage
        bValue = b.gapPercentage
        break
      case 'lastAssessed':
        aValue = a.lastAssessedDate?.getTime() || 0
        bValue = b.lastAssessedDate?.getTime() || 0
        break
      case 'category':
        aValue = a.categoryName.toLowerCase()
        bValue = b.categoryName.toLowerCase()
        break
      default:
        return 0
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <RiArrowUpLine className="inline h-4 w-4 ml-1" />
    ) : (
      <RiArrowDownLine className="inline h-4 w-4 ml-1" />
    )
  }

  if (skillGaps.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No skill gaps found matching your filters.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('skillName')}
            >
              Skill Name <SortIcon field="skillName" />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('category')}
            >
              Category <SortIcon field="category" />
            </TableHead>
            <TableHead>Current Level</TableHead>
            <TableHead>Desired Level</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('gapPercentage')}
            >
              Gap <SortIcon field="gapPercentage" />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('lastAssessed')}
            >
              Last Assessed <SortIcon field="lastAssessed" />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedGaps.map((gap) => (
            <TableRow key={gap.skillId}>
              <TableCell className="font-medium">{gap.skillName}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline"
                  style={{ borderColor: gap.categoryColor, color: gap.categoryColor }}
                >
                  {gap.categoryName}
                </Badge>
              </TableCell>
              <TableCell>
                {gap.currentLevel ? (
                  <Badge variant="secondary">{gap.currentLevel}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Not assessed</span>
                )}
              </TableCell>
              <TableCell>
                <Badge>{gap.desiredLevel}</Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1 min-w-37.5">
                  <div className="flex items-center justify-between">
                    <GapCategoryBadge 
                      category={gap.gapCategory} 
                      gapPercentage={gap.gapPercentage} 
                    />
                  </div>
                  <Progress 
                    value={100 - gap.gapPercentage} 
                    className="h-2"
                  />
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={gap.trainingAssigned ? "default" : "secondary"}
                  className={gap.trainingAssigned ? "bg-blue-500" : ""}
                >
                  {gap.trainingAssigned ? 'Training Assigned' : gap.status.replace(/_/g, ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {gap.lastAssessedDate ? (
                  <span className="text-sm text-muted-foreground">
                    {format(gap.lastAssessedDate, 'MMM d, yyyy')}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Edit desired level"
                  >
                    <RiEditLine className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Remove from matrix"
                    onClick={() => handleDelete(gap.skillId)}
                  >
                    <RiDeleteBinLine className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
