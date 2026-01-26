'use client'

import { type SkillGapData } from '@/types/skill-matrix'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface CompetencyRadarChartProps {
  skillGaps: SkillGapData[]
}

const levelToNumeric = (level: string | null): number => {
  if (!level) return 0
  const mapping: Record<string, number> = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
  }
  return mapping[level] || 0
}

export function CompetencyRadarChart({ skillGaps }: CompetencyRadarChartProps) {
  // Limit to top 8 skills with highest gaps for readability
  const topGaps = skillGaps
    .filter(gap => gap.gapPercentage > 0)
    .sort((a, b) => b.gapPercentage - a.gapPercentage)
    .slice(0, 8)

  const chartData = topGaps.map((gap) => ({
    skill: gap.skillName.length > 15 ? gap.skillName.slice(0, 15) + '...' : gap.skillName,
    current: levelToNumeric(gap.currentLevel),
    desired: levelToNumeric(gap.desiredLevel),
  }))

  if (chartData.length === 0) {
    return (
      <div className="h-75 flex items-center justify-center text-muted-foreground">
        No gaps to display
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis 
          dataKey="skill" 
          tick={{ fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 4]} 
          tickCount={5}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload
              const levelNames = ['None', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-semibold mb-2">{data.skill}</p>
                  <p className="text-sm">
                    <span className="text-blue-600">Current:</span> {levelNames[data.current]}
                  </p>
                  <p className="text-sm">
                    <span className="text-green-600">Desired:</span> {levelNames[data.desired]}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Radar
          name="Current Level"
          dataKey="current"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
        />
        <Radar
          name="Desired Level"
          dataKey="desired"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
