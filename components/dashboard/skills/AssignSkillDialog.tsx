"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RiLoader4Line, RiSparklingLine } from "@remixicon/react"
import { createSkillMatrixEntry } from "@/actions/skill-matrix"
import { CompetencyLevel } from "@prisma/client"

interface Skill {
  id: string
  name: string
  categoryId: string
  category: {
    id: string
    name: string
    colorClass: string
  }
}

interface AssignSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
  skills: Skill[]
}

const COMPETENCY_LEVELS = [
  { value: null, label: "Not Acquired", dbValue: null, description: "No current skill", level: 0, color: "bg-gray-500" },
  { value: 1, label: "Beginner", dbValue: "BEGINNER", description: "Just starting", level: 1, color: "bg-blue-500" },
  { value: 2, label: "Basic", dbValue: "BASIC", description: "Little experience", level: 2, color: "bg-cyan-500" },
  { value: 3, label: "Intermediate", dbValue: "INTERMEDIATE", description: "Comfortable", level: 3, color: "bg-green-500" },
  { value: 4, label: "Advanced", dbValue: "ADVANCED", description: "Very skilled", level: 4, color: "bg-orange-500" },
  { value: 5, label: "Expert", dbValue: "EXPERT", description: "Master level", level: 5, color: "bg-purple-500" },
] as const

const DESIRED_LEVELS = COMPETENCY_LEVELS.filter(l => l.value !== null)

export function AssignSkillDialog({
  open,
  onOpenChange,
  userId,
  userName,
  skills,
}: AssignSkillDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [selectedSkillId, setSelectedSkillId] = useState<string>("")
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)
  const [desiredLevel, setDesiredLevel] = useState<number>(1)
  const [searchTerm, setSearchTerm] = useState("")

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedSkillId("")
      setCurrentLevel(null)
      setDesiredLevel(1)
      setSearchTerm("")
    }
  }, [open])

  // Calculate gap percentage
  const calculateGap = () => {
    const current = currentLevel || 0
    const desired = desiredLevel
    if (desired === 0) return 0
    if (current === 0) return 100
    if (current >= desired) return 0
    return Math.round(((desired - current) / desired) * 100)
  }

  const gapPercentage = calculateGap()

  // Filter skills by search
  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSkillId) {
      toast.error("Please select a skill")
      return
    }

    setIsLoading(true)

    try {
      const currentLevelDb = currentLevel !== null 
        ? COMPETENCY_LEVELS.find(l => l.value === currentLevel)?.dbValue
        : undefined
      
      const desiredLevelDb = DESIRED_LEVELS.find(l => l.value === desiredLevel)?.dbValue

      if (!desiredLevelDb) {
        toast.error("Please select a valid desired level")
        setIsLoading(false)
        return
      }

      const entryId = await createSkillMatrixEntry({
        userId,
        skillId: selectedSkillId,
        currentLevel: currentLevelDb as CompetencyLevel | undefined,
        desiredLevel: desiredLevelDb as CompetencyLevel,
      })

      // Success - entryId is returned
      toast.success(`Skill assigned to ${userName}`)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error assigning skill:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred while assigning the skill"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedSkill = skills.find(s => s.id === selectedSkillId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Skill to {userName}</DialogTitle>
          <DialogDescription>
            Select a skill and define the employee's current and desired proficiency levels.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Skill Selection */}
          <div className="space-y-3">
            <Label htmlFor="skill">Select Skill *</Label>
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger id="skill">
                <SelectValue placeholder="Choose a skill..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredSkills.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No skills found
                  </div>
                ) : (
                  filteredSkills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${skill.category.colorClass}`} />
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({skill.category.name})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedSkill && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedSkill.name}</p>
                <p className="text-xs text-muted-foreground">
                  Category: {selectedSkill.category.name}
                </p>
              </div>
            )}
          </div>

          {/* Current Level */}
          <div className="space-y-3">
            <div>
              <Label>Current Proficiency Level *</Label>
              <p className="text-xs text-muted-foreground mt-1">
                What is {userName}'s current skill level? Select "Not Acquired" if they don't have this skill yet.
              </p>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {COMPETENCY_LEVELS.map((level) => (
                <button
                  key={level.level}
                  type="button"
                  onClick={() => setCurrentLevel(level.value)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                    ${currentLevel === level.value 
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 shadow-md ring-2 ring-emerald-600/30' 
                      : 'border-border hover:border-emerald-600/50 hover:bg-accent hover:scale-105'
                    }
                  `}
                >
                  <span className={`w-3 h-3 rounded-full ${level.color} mb-1`} />
                  <span className="text-xl font-bold">{level.level}</span>
                  <span className="text-[10px] font-medium mt-0.5 text-center leading-tight">{level.label}</span>
                  <span className="text-[8px] text-muted-foreground leading-tight text-center">
                    {level.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Desired Level */}
          <div className="space-y-3">
            <div>
              <Label>Desired Proficiency Level *</Label>
              <p className="text-xs text-muted-foreground mt-1">
                What level should {userName} achieve?
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {DESIRED_LEVELS.map((level) => {
                const isDisabled = currentLevel !== null && level.value !== null && level.value <= currentLevel
                return (
                  <button
                    key={level.level}
                    type="button"
                    onClick={() => !isDisabled && setDesiredLevel(level.value!)}
                    disabled={isDisabled}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                      ${desiredLevel === level.value 
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 shadow-md ring-2 ring-emerald-600/30' 
                        : isDisabled
                        ? 'border-border bg-muted/50 opacity-40 cursor-not-allowed'
                        : 'border-border hover:border-emerald-600/50 hover:bg-accent hover:scale-105'
                      }
                    `}
                  >
                    <span className={`w-3 h-3 rounded-full ${level.color} mb-1`} />
                    <span className="text-xl font-bold">{level.level}</span>
                    <span className="text-[10px] font-medium mt-0.5 text-center leading-tight">{level.label}</span>
                    <span className="text-[8px] text-muted-foreground leading-tight text-center">
                      {level.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gap Preview */}
          {selectedSkillId && (
            <div className="p-4 bg-linear-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiSparklingLine className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-sm">Skill Gap Preview</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`
                    ${gapPercentage > 70 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                    ${gapPercentage > 30 && gapPercentage <= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                    ${gapPercentage <= 30 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                  `}
                >
                  {gapPercentage}% Gap
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Current: <strong>{COMPETENCY_LEVELS.find(l => l.value === currentLevel)?.label || 'Not Set'}</strong></span>
                <span>→</span>
                <span>Desired: <strong>{DESIRED_LEVELS.find(l => l.value === desiredLevel)?.label}</strong></span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedSkillId}>
              {isLoading ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Skill"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
