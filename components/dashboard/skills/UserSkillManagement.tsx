"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AssignSkillDialog } from "./AssignSkillDialog"
import { EditSkillLevelDialog } from "./EditSkillLevelDialog"
import { deleteSkillMatrixEntry } from "@/actions/skill-matrix"
import {
  RiAddLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiSparklingLine,
  RiBookOpenLine,
} from "@remixicon/react"
import { CompetencyLevel } from "@prisma/client"

interface SkillMatrixEntry {
  id: string
  skillId: string
  desiredLevel: CompetencyLevel
  currentLevel: CompetencyLevel | null
  gapPercentage: number | null
  status: string
  skill: {
    id: string
    name: string
    category: {
      id: string
      name: string
      colorClass: string
    }
  }
}

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

interface UserSkillManagementProps {
  userId: string
  userName: string
  skillMatrix: SkillMatrixEntry[]
  availableSkills: Skill[]
  isManager?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  gap_identified: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  training_assigned: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  not_started: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-blue-500",
  BASIC: "bg-cyan-500",
  INTERMEDIATE: "bg-green-500",
  ADVANCED: "bg-orange-500",
  EXPERT: "bg-purple-500",
}

export function UserSkillManagement({
  userId,
  userName,
  skillMatrix,
  availableSkills,
  isManager = false,
}: UserSkillManagementProps) {
  const router = useRouter()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<SkillMatrixEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter skills
  const filteredMatrix = skillMatrix.filter(entry =>
    entry.skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.skill.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate statistics
  const totalSkills = skillMatrix.length
  const skillsWithGaps = skillMatrix.filter(e => (e.gapPercentage || 0) > 0).length
  const avgGap = skillMatrix.length > 0
    ? Math.round(skillMatrix.reduce((sum: number, e: { gapPercentage: number | null }) => sum + (e.gapPercentage || 0), 0) / skillMatrix.length)
    : 0

  const handleDelete = async () => {
    if (!selectedEntry) return

    setIsDeleting(true)
    try {
      await deleteSkillMatrixEntry(userId, selectedEntry.skillId)
      toast.success("Skill removed from matrix")
      setDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete skill")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <RiBookOpenLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSkills}</div>
            <p className="text-xs text-muted-foreground">Skills in matrix</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills with Gaps</CardTitle>
            <RiSparklingLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{skillsWithGaps}</div>
            <p className="text-xs text-muted-foreground">Require development</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Gap</CardTitle>
            <RiSparklingLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGap}%</div>
            <p className="text-xs text-muted-foreground">Across all skills</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Skill Matrix Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Skill Matrix</CardTitle>
              <CardDescription>
                Manage {userName}'s skills, competency levels, and development gaps
              </CardDescription>
            </div>
            <Button onClick={() => setAssignDialogOpen(true)}>
              <RiAddLine className="mr-2 h-4 w-4" />
              Assign Skill
            </Button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Level</TableHead>
                  <TableHead>Desired Level</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatrix.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No skills match your search" : "No skills assigned yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatrix.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.skill.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${entry.skill.category.colorClass}`} />
                          <span className="text-sm">{entry.skill.category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.currentLevel ? (
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${LEVEL_COLORS[entry.currentLevel]}`} />
                            <span className="text-sm">{entry.currentLevel}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not Acquired</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${LEVEL_COLORS[entry.desiredLevel]}`} />
                          <span className="text-sm">{entry.desiredLevel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={100 - (entry.gapPercentage || 0)} className="h-2 w-20" />
                            <span className="text-sm font-medium">{entry.gapPercentage || 0}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_COLORS[entry.status] || ""}>
                          {entry.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <RiMoreLine className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEntry(entry)
                                setEditDialogOpen(true)
                              }}
                            >
                              <RiEditLine className="mr-2 h-4 w-4" />
                              Edit Levels
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedEntry(entry)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <RiDeleteBinLine className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AssignSkillDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        userId={userId}
        userName={userName}
        skills={availableSkills}
      />

      {selectedEntry && (
        <EditSkillLevelDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          skillId={selectedEntry.skillId}
          skillName={selectedEntry.skill.name}
          userId={userId}
          currentDesiredLevel={selectedEntry.desiredLevel}
          currentLevel={selectedEntry.currentLevel}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedEntry?.skill.name}" from {userName}'s skill matrix?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
