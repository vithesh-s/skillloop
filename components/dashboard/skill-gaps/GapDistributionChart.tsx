'use client'

import { type SkillGapData } from '@/types/skill-matrix'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface GapDistributionChartProps {
  gapsByCategory: Record<string, SkillGapData[]>
}

export function GapDistributionChart({ gapsByCategory }: GapDistributionChartProps) {
  // Prepare chart data
  const chartData = Object.entries(gapsByCategory).map(([categoryName, gaps]) => {
    const averageGap = gaps.reduce((sum: number, gap: { gapPercentage: number }) => sum + gap.gapPercentage, 0) / gaps.length
    const categoryColor = gaps[0]?.categoryColor || '#6B7280'
    
    return {
      category: categoryName,
      averageGap: Math.round(averageGap * 10) / 10,
      skillCount: gaps.length,
      color: categoryColor,
    }
  }).sort((a, b) => b.averageGap - a.averageGap)

  if (chartData.length === 0) {
    return (
      <div className="h-75 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="category" 
          angle={-45}
          textAnchor="end"
          height={80}
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
                  <p className="font-semibold">{data.category}</p>
                  <p className="text-sm text-muted-foreground">
                    Average Gap: {data.averageGap}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Skills: {data.skillCount}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Bar 
          dataKey="averageGap" 
          name="Average Gap %" 
          radius={[8, 8, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
