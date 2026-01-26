'use client'

import { type DepartmentTNASummary } from '@/types/skill-matrix'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface OrganizationGapChartProps {
  departmentBreakdown: DepartmentTNASummary[]
}

export function OrganizationGapChart({ departmentBreakdown }: OrganizationGapChartProps) {
  const chartData = departmentBreakdown
    .map(dept => ({
      department: dept.department,
      avgGap: Math.round(dept.averageGapScore * 10) / 10,
      criticalGaps: dept.criticalGapsCount,
      employees: dept.employeeCount,
    }))
    .sort((a, b) => b.avgGap - a.avgGap)

  if (chartData.length === 0) {
    return (
      <div className="h-75 flex items-center justify-center text-muted-foreground">
        No department data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="department" 
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis 
          label={{ value: 'Average Gap (%)', angle: -90, position: 'insideLeft' }}
          domain={[0, 100]}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload[0]) {
              const data = payload[0].payload
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-semibold mb-2">{data.department}</p>
                  <p className="text-sm">Average Gap: {data.avgGap}%</p>
                  <p className="text-sm">Critical Gaps: {data.criticalGaps}</p>
                  <p className="text-sm">Employees: {data.employees}</p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Bar 
          dataKey="avgGap" 
          name="Average Gap %" 
          fill="#3b82f6"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
