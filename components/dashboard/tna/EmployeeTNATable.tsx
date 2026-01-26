'use client'

import { useState } from 'react'
import { type TNAReport } from '@/types/skill-matrix'
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
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { AssignTrainingDialog } from './AssignTrainingDialog'
import { RiSearchLine, RiDownloadLine, RiEyeLine, RiBookOpenLine, RiCheckboxMultipleLine } from '@remixicon/react'

interface EmployeeTNATableProps {
  employeeTNAs: TNAReport[]
  availableTrainings?: Array<{
    id: string
    topicName: string
    mode: string
    skillId: string
    skill: { name: string }
  }>
}

export function EmployeeTNATable({ employeeTNAs, availableTrainings = [] }: EmployeeTNATableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'gap' | 'critical'>('critical')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  // Filter and sort
  const filteredTNAs = employeeTNAs
    .filter(tna => 
      tna.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tna.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tna.department && tna.department.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'name':
          compareValue = a.userName.localeCompare(b.userName)
          break
        case 'gap':
          compareValue = a.overallGapScore - b.overallGapScore
          break
        case 'critical':
          compareValue = a.criticalGapsCount - b.criticalGapsCount
          break
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue
    })

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getGapColor = (gap: number) => {
    if (gap > 50) return 'text-destructive'
    if (gap > 30) return 'text-orange-500'
    if (gap > 15) return 'text-yellow-500'
    return 'text-blue-500'
  }

  const toggleEmployeeSelection = (userId: string) => {
    const newSelection = new Set(selectedEmployees)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedEmployees(newSelection)
  }

  const toggleAllSelection = () => {
    if (selectedEmployees.size === filteredTNAs.length) {
      setSelectedEmployees(new Set())
    } else {
      setSelectedEmployees(new Set(filteredTNAs.map(tna => tna.userId)))
    }
  }

  const handleAssignTraining = (userId?: string) => {
    if (userId) {
      setSelectedEmployees(new Set([userId]))
    }
    setAssignDialogOpen(true)
  }

  const selectedTNAs = employeeTNAs.filter(tna => selectedEmployees.has(tna.userId))

  if (employeeTNAs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No employee TNA data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedEmployees.size > 0 && (
          <Button onClick={() => handleAssignTraining()}>
            <RiBookOpenLine className="mr-2 h-4 w-4" />
            Assign Training ({selectedEmployees.size})
          </Button>
        )}
        <Button variant="outline">
          <RiDownloadLine className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEmployees.size === filteredTNAs.length && filteredTNAs.length > 0}
                  onCheckedChange={toggleAllSelection}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                Employee Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Skills Tracked</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('critical')}
              >
                Critical Gaps {sortBy === 'critical' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('gap')}
              >
                Avg Gap {sortBy === 'gap' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTNAs.map((tna) => (
              <TableRow key={tna.userId}>
                <TableCell>
                  <Checkbox
                    checked={selectedEmployees.has(tna.userId)}
                    onCheckedChange={() => toggleEmployeeSelection(tna.userId)}
                    aria-label={`Select ${tna.userName}`}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{tna.userName}</p>
                    <p className="text-sm text-muted-foreground">{tna.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {tna.department ? (
                    <Badge variant="outline">{tna.department}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {tna.roleName || <span className="text-muted-foreground text-sm">N/A</span>}
                </TableCell>
                <TableCell>{tna.totalSkillsTracked}</TableCell>
                <TableCell>
                  {tna.criticalGapsCount > 0 ? (
                    <Badge variant="destructive">{tna.criticalGapsCount}</Badge>
                  ) : (
                    <Badge variant="secondary">0</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1 min-w-25">
                    <span className={`font-semibold ${getGapColor(tna.overallGapScore)}`}>
                      {tna.overallGapScore.toFixed(1)}%
                    </span>
                    <Progress 
                      value={100 - tna.overallGapScore} 
                      className="h-2"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Assign Training"
                      onClick={() => handleAssignTraining(tna.userId)}
                      disabled={tna.criticalGapsCount === 0 && tna.highGapsCount === 0}
                    >
                      <RiBookOpenLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="View Details">
                      <RiEyeLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Export TNA">
                      <RiDownloadLine className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTNAs.length === 0 && searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          No employees found matching "{searchTerm}"
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTNAs.length} of {employeeTNAs.length} employees
        {selectedEmployees.size > 0 && (
          <span className="ml-2 font-medium">• {selectedEmployees.size} selected</span>
        )}
      </div>

      {/* Assign Training Dialog */}
      <AssignTrainingDialog
        selectedEmployees={selectedTNAs}
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open)
          if (!open) {
            setSelectedEmployees(new Set())
          }
        }}
        availableTrainings={availableTrainings}
      />
    </div>
  )
}
