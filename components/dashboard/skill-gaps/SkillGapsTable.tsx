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
import { EditDesiredLevelDialog } from './EditDesiredLevelDialog'
import { RiArrowUpLine, RiArrowDownLine, RiEditLine, RiDeleteBinLine } from '@remixicon/react'
import { format } from 'date-fns'
import { deleteSkillMatrixEntry } from '@/actions/skill-matrix'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type SortField = 'skillName' | 'gapPercentage' | 'lastAssessed' | 'category'
type SortOrder = 'asc' | 'desc'

interface SkillGapsTableProps {
  skillGaps: SkillGapData[]
  userId: string
}

export function SkillGapsTable({ skillGaps, userId }: SkillGapsTableProps) {
  const [sortField, setSortField] = useState<SortField>('gapPercentage')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [editingSkill, setEditingSkill] = useState<SkillGapData | null>(null)
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (skillId: string, skillName: string) => {
    if (!confirm(`Are you sure you want to remove "${skillName}" from your skill matrix?`)) {
      return
    }

    setDeletingSkillId(skillId)
    try {
      await deleteSkillMatrixEntry(userId, skillId)
      toast.success('Skill removed successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove skill')
    } finally {
      setDeletingSkillId(null)
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
                  <Badge variant="outline" className="text-muted-foreground">Not assessed</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge>{gap.desiredLevel}</Badge>
              </TableCell>
              <TableCell>
                <div className="min-w-37.5">
                  <GapCategoryBadge 
                    category={gap.gapCategory} 
                    gapPercentage={gap.gapPercentage}
                    status={gap.status}
                  />
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={gap.trainingAssigned ? "default" : "secondary"}
                  className={gap.trainingAssigned ? "bg-blue-500" : ""}
                >
                  {gap.trainingAssigned ? 'Training Assigned' : gap.status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
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
                <div className="flex items-center gap-1">
                  {!gap.trainingAssigned ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Edit skill levels"
                        onClick={() => setEditingSkill(gap)}
                        disabled={deletingSkillId === gap.skillId}
                      >
                        <RiEditLine className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Remove skill"
                        onClick={() => handleDelete(gap.skillId, gap.skillName)}
                        disabled={deletingSkillId === gap.skillId}
                        className="text-destructive hover:text-destructive"
                      >
                        <RiDeleteBinLine className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Desired Level Dialog */}
      {editingSkill && (
        <EditDesiredLevelDialog
          open={!!editingSkill}
          onOpenChange={(open) => !open && setEditingSkill(null)}
          skillId={editingSkill.skillId}
          skillName={editingSkill.skillName}
          userId={userId}
          currentDesiredLevel={editingSkill.desiredLevel}
          currentLevel={editingSkill.currentLevel}
        />
      )}
    </div>
  )
}
