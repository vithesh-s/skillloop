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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RiAddLine, RiLoader4Line } from "@remixicon/react"
import { addUserSkill } from "@/actions/skill-matrix"

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

interface AddSkillDialogProps {
  skills: Skill[]
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  buttonText?: string
}

const COMPETENCY_LEVELS = [
  { value: 1, label: "Beginner", description: "Just starting out" },
  { value: 2, label: "Basic", description: "Little experience" },
  { value: 3, label: "Intermediate", description: "Comfortable" },
  { value: 4, label: "Advanced", description: "Very skilled" },
  { value: 5, label: "Expert", description: "Master level" },
]

const numericToLevel = (value: number): string => {
  const mapping: Record<number, string> = {
    1: 'BEGINNER',
    2: 'BASIC',
    3: 'INTERMEDIATE',
    4: 'ADVANCED',
    5: 'EXPERT',
  }
  return mapping[value] || 'BEGINNER'
}

export function AddSkillDialog({
  skills,
  variant = "default",
  size = "default",
  className,
  buttonText = "Add Skills"
}: AddSkillDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [selectedSkillId, setSelectedSkillId] = useState<string>("")
  const [customSkillName, setCustomSkillName] = useState<string>("")
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [desiredLevel, setDesiredLevel] = useState<number>(1)
  const [notes, setNotes] = useState<string>("")
  const [isCustomSkill, setIsCustomSkill] = useState(false)

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedSkillId("")
      setCustomSkillName("")
      setCurrentLevel(1)
      setDesiredLevel(1)
      setNotes("")
      setIsCustomSkill(false)
    }
  }, [open])

  // Ensure desired level is HIGHER than current level (not equal)
  useEffect(() => {
    if (desiredLevel <= currentLevel) {
      setDesiredLevel(currentLevel + 1)
    }
  }, [currentLevel, desiredLevel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isCustomSkill && !selectedSkillId) {
      toast.error("Please select a skill")
      return
    }

    if (isCustomSkill && !customSkillName.trim()) {
      toast.error("Please enter a skill name")
      return
    }

    setIsLoading(true)

    try {
      const result = await addUserSkill({
        skillId: isCustomSkill ? undefined : selectedSkillId,
        customSkillName: isCustomSkill ? customSkillName.trim() : undefined,
        currentLevel,
        desiredLevel,
        notes: notes.trim() || undefined,
      })

      if (result.success) {
        toast.success(result.message || "Skill added successfully!")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.message || "Failed to add skill")
      }
    } catch (error) {
      console.error("Error adding skill:", error)
      toast.error("An error occurred while adding the skill")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <RiAddLine className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Skill</DialogTitle>
          <DialogDescription>
            Select a skill from the list or add your own, then assess your current and desired proficiency levels.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Skill Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <Button
                type="button"
                variant={!isCustomSkill ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCustomSkill(false)}
              >
                Choose from List
              </Button>
              <Button
                type="button"
                variant={isCustomSkill ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCustomSkill(true)}
              >
                Add Custom Skill
              </Button>
            </div>

            {!isCustomSkill ? (
              <div className="space-y-2">
                <Label htmlFor="skill">Select Skill</Label>
                <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                  <SelectTrigger id="skill">
                    <SelectValue placeholder="Choose a skill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full bg-${skill.category.colorClass}`} />
                          {skill.name}
                          <span className="text-xs text-muted-foreground">
                            ({skill.category.name})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="customSkill">Skill Name</Label>
                <Input
                  id="customSkill"
                  placeholder="e.g., Project Management, Leadership"
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Current Level */}
          <div className="space-y-2">
            <Label>Current Proficiency Level</Label>
            <p className="text-xs text-muted-foreground">
              How would you rate your current skill level?
            </p>
            <div className="grid grid-cols-5 gap-2">
              {COMPETENCY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setCurrentLevel(level.value)}
                  className={`
                    flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all
                    ${currentLevel === level.value 
                      ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                    }
                  `}
                >
                  <span className="text-xl font-bold">{level.value}</span>
                  <span className="text-[11px] font-medium mt-0.5">{level.label}</span>
                  <span className="text-[9px] text-muted-foreground leading-tight">
                    {level.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Desired Level */}
          <div className="space-y-2">
            <Label>Desired Proficiency Level</Label>
            <p className="text-xs text-muted-foreground">
              What level do you want to achieve?
            </p>
            <div className="grid grid-cols-5 gap-2">
              {COMPETENCY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setDesiredLevel(level.value)}
                  disabled={level.value <= currentLevel}
                  className={`
                    flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all
                    ${desiredLevel === level.value 
                      ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20' 
                      : level.value <= currentLevel
                      ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                    }
                  `}
                >
                  <span className="text-xl font-bold">{level.value}</span>
                  <span className="text-[11px] font-medium mt-0.5">{level.label}</span>
                  <span className="text-[9px] text-muted-foreground leading-tight">
                    {level.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about your experience with this skill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Skill"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
