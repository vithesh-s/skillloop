"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { SkillScore } from "@/types/assessment"

interface SkillBreakdownChartProps {
  skillScores: SkillScore[]
}

export function SkillBreakdownChart({ skillScores }: SkillBreakdownChartProps) {
  const chartData = skillScores.map((skill) => ({
    skill: skill.skillName,
    percentage: skill.percentage,
    score: skill.score,
    maxScore: skill.maxScore,
  }))

  const chartConfig = {
    percentage: {
      label: "Score %",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const getBarColor = (percentage: number) => {
    if (percentage >= 70) return "hsl(142, 76%, 36%)" // green
    if (percentage >= 50) return "hsl(45, 93%, 47%)" // yellow
    return "hsl(0, 84%, 60%)" // red
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill-wise Performance</CardTitle>
        <CardDescription>
          Your score breakdown by skill
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="skill"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <ChartTooltipContent>
                      <div className="space-y-1">
                        <p className="font-semibold">{data.skill}</p>
                        <p className="text-sm">Score: {data.score}/{data.maxScore}</p>
                        <p className="text-sm">Percentage: {data.percentage.toFixed(1)}%</p>
                      </div>
                    </ChartTooltipContent>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="percentage"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
