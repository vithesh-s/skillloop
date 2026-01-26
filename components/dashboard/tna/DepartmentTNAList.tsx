'use client'

import { type DepartmentTNASummary } from '@/types/skill-matrix'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RiTeamLine, RiErrorWarningLine } from '@remixicon/react'

interface DepartmentTNAListProps {
  departments: DepartmentTNASummary[]
}

export function DepartmentTNAList({ departments }: DepartmentTNAListProps) {
  if (departments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No department data available
        </CardContent>
      </Card>
    )
  }

  const sortedDepartments = [...departments].sort((a, b) => 
    b.averageGapScore - a.averageGapScore
  )

  const getGapSeverity = (gap: number) => {
    if (gap > 50) return { label: 'Critical', color: 'bg-destructive' }
    if (gap > 30) return { label: 'High', color: 'bg-orange-500' }
    if (gap > 15) return { label: 'Medium', color: 'bg-yellow-500' }
    return { label: 'Low', color: 'bg-blue-500' }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedDepartments.map((dept) => {
        const severity = getGapSeverity(dept.averageGapScore)
        
        return (
          <Card key={dept.department}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{dept.department}</CardTitle>
                  <CardDescription className="mt-1">
                    {dept.employeeCount} {dept.employeeCount === 1 ? 'employee' : 'employees'}
                  </CardDescription>
                </div>
                <Badge className={severity.color}>
                  {severity.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Average Gap Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Gap</span>
                  <span className="font-semibold">{dept.averageGapScore.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={100 - dept.averageGapScore} 
                  className="h-2"
                />
              </div>

              {/* Critical Gaps */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <RiErrorWarningLine className="h-4 w-4 text-destructive" />
                  <span className="text-muted-foreground">Critical Gaps</span>
                </div>
                <span className="font-semibold text-destructive">
                  {dept.criticalGapsCount}
                </span>
              </div>

              {/* Top Gap Skills */}
              {dept.topGapSkills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Top Gap Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {dept.topGapSkills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {dept.topGapSkills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{dept.topGapSkills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Training Budget Estimate (if available) */}
              {dept.trainingBudgetEstimate && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Training Budget</span>
                    <span className="font-semibold">
                      ${dept.trainingBudgetEstimate.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
