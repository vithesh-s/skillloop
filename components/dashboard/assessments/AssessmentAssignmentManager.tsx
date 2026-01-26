"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RiSearchLine, RiUserAddLine, RiDeleteBinLine } from "@remixicon/react"
import { getUsers } from "@/actions/users"
import { assignAssessment, unassignAssessment, getAssignedUsers } from "@/actions/assessments"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AssessmentAssignmentManagerProps {
  assessmentId: string
}

export function AssessmentAssignmentManager({ assessmentId }: AssessmentAssignmentManagerProps) {
  const [assignedUsers, setAssignedUsers] = useState<any[]>([])
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadAssignedUsers()
  }, [assessmentId])

  const loadAssignedUsers = async () => {
    const users = await getAssignedUsers(assessmentId)
    setAssignedUsers(users)
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setLoading(true)
    try {
      const result = await getUsers({ search: searchTerm, page: 1, pageSize: 20 })
      // Filter out already assigned users
      const assignedIds = new Set(assignedUsers.map(u => u.user.id))
      setSearchResults(result.users.filter((u: any) => !assignedIds.has(u.id)))
    } catch (error) {
      toast.error("Failed to search users")
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (selectedUsers.length === 0) return

    setLoading(true)
    try {
      const result = await assignAssessment(assessmentId, selectedUsers)
      if (result.success) {
        toast.success(result.message)
        setIsAssignDialogOpen(false)
        setSelectedUsers([])
        setSearchTerm("")
        setSearchResults([])
        loadAssignedUsers() // Reload list
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to assign users")
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async (userId: string) => {
    if (!confirm("Are you sure you want to unassign this user?")) return

    try {
      const result = await unassignAssessment(assessmentId, userId)
      if (result.success) {
        toast.success(result.message)
        loadAssignedUsers()
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to unassign user")
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Assigned Learners</h3>
          <p className="text-sm text-muted-foreground">
            {assignedUsers.length} users assigned to this assessment
          </p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <RiUserAddLine className="mr-2 h-4 w-4" />
              Assign Users
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle>Assign Learners</DialogTitle>
              <DialogDescription>
                Search and select learners to assign this assessment to.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <RiSearchLine className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button variant="secondary" onClick={handleSearch} disabled={loading}>
                  Search
                </Button>
              </div>

              <div className="border rounded-md max-h-75 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {loading ? "Searching..." : "No users found. Try a different search."}
                  </div>
                ) : (
                  <div className="divide-y">
                    {searchResults.map((user: any) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 ${
                          selectedUsers.includes(user.id) ? "bg-muted" : ""
                        }`}
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          readOnly
                          className="h-4 w-4"
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {user.designation && (
                          <Badge variant="outline" className="text-xs">
                            {user.designation}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground text-right">
                {selectedUsers.length} users selected
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={loading || selectedUsers.length === 0}>
                {loading ? "Assigning..." : "Assign Selected"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No users assigned yet
                </TableCell>
              </TableRow>
            ) : (
              assignedUsers.map((assignment) => (
                <TableRow key={assignment.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={assignment.user.avatar} />
                        <AvatarFallback>{assignment.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{assignment.user.name}</p>
                        <p className="text-xs text-muted-foreground">{assignment.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.assignedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={assignment.status === "COMPLETED" ? "default" : "secondary"}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/90"
                      onClick={() => handleUnassign(assignment.userId)}
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
