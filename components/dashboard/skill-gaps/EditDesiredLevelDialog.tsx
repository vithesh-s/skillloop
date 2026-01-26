'use client'

import { useState } from 'react'
import { updateDesiredLevel } from '@/actions/skill-matrix'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RiLoader4Line } from '@remixicon/react'
import { toast } from 'sonner'
import { CompetencyLevel } from '@prisma/client'

interface EditDesiredLevelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillId: string
  skillName: string
  userId: string
  currentDesiredLevel: CompetencyLevel
  currentLevel: CompetencyLevel | null
}

const COMPETENCY_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Just starting out', level: 1 },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Comfortable', level: 2 },
  { value: 'ADVANCED', label: 'Advanced', description: 'Very skilled', level: 3 },
  { value: 'EXPERT', label: 'Expert', description: 'Master level', level: 4 },
] as const

const levelToNumeric = (level: CompetencyLevel | null): number => {
  if (!level) return 0
  const mapping: Record<string, number> = {
    'BEGINNER': 1,
    'INTERMEDIATE': 2,
    'ADVANCED': 3,
    'EXPERT': 4,
  }
  return mapping[level] || 0
}

export function EditDesiredLevelDialog({
  open,
  onOpenChange,
  skillId,
  skillName,
  userId,
  currentDesiredLevel,
  currentLevel,
}: EditDesiredLevelDialogProps) {
  const [desiredLevel, setDesiredLevel] = useState<CompetencyLevel>(currentDesiredLevel)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await updateDesiredLevel({
        userId,
        skillId,
        desiredLevel,
      })
      toast.success('Desired level updated successfully')
      onOpenChange(false)
      window.location.reload() // Refresh to show updated data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update desired level')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Edit Desired Level</DialogTitle>
          <DialogDescription>
            Update your desired proficiency level for <strong>{skillName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Level Info */}
          {currentLevel && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Current Level: <strong className="text-foreground">{currentLevel}</strong>
              </p>
            </div>
          )}

          {/* Desired Level Selection */}
          <div className="space-y-3">
            <Label>Desired Proficiency Level</Label>
            <p className="text-xs text-muted-foreground">
              What level do you want to achieve?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {COMPETENCY_LEVELS.map((level) => {
                const currentLevelNumeric = levelToNumeric(currentLevel)
                const isDisabled = level.level <= currentLevelNumeric
                return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => !isDisabled && setDesiredLevel(level.value as CompetencyLevel)}
                  disabled={isDisabled}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all text-left
                    ${desiredLevel === level.value
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : isDisabled
                      ? 'border-gray-200 bg-muted/50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="font-semibold text-2xl mb-1">{level.level}</div>
                  <div className="font-medium text-sm">{level.label}</div>
                  <div className="text-xs text-muted-foreground">{level.description}</div>
                </button>
              )})
              }
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || desiredLevel === currentDesiredLevel}
          >
            {isLoading && <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
