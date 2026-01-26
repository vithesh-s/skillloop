import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { analyzeUserSkillGaps, getTrainingRecommendations } from '@/actions/skill-matrix'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  RiBarChartBoxLine, 
  RiCheckboxCircleLine, 
  RiErrorWarningLine,
  RiBookOpenLine
} from '@remixicon/react'
import { SkillGapsTable } from '@/components/dashboard/skill-gaps/SkillGapsTable'
import { GapDistributionChart } from '@/components/dashboard/skill-gaps/GapDistributionChart'
import { CompetencyRadarChart } from '@/components/dashboard/skill-gaps/CompetencyRadarChart'
import { TrainingRecommendationsList } from '@/components/dashboard/skill-gaps/TrainingRecommendationsList'
import { SkillGapFilters } from '@/components/dashboard/skill-gaps/SkillGapFilters'
import { AddSkillDialog } from '@/components/dashboard/skills/AddSkillDialog'

import { GapAnalysisFiltersInput } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SkillGapsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const filters: GapAnalysisFiltersInput = {
    categoryId: typeof searchParams.categoryId === 'string' && searchParams.categoryId !== 'all' 
      ? searchParams.categoryId 
      : undefined,
    status: typeof searchParams.status === 'string' && searchParams.status !== 'all'
      ? [searchParams.status] as any
      : undefined,
    searchTerm: typeof searchParams.searchTerm === 'string' 
      ? searchParams.searchTerm 
      : undefined,
    gapCategories: typeof searchParams.gapCategories === 'string' 
      ? [searchParams.gapCategories as any]
      : Array.isArray(searchParams.gapCategories) 
        ? searchParams.gapCategories as any
        : undefined
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Skills</h1>
          <p className="text-muted-foreground mt-1">
            Track your skill development progress and identify training opportunities
          </p>
        </div>
      </div>

      {/* Suspense boundary for data fetching */}
      <Suspense fallback={<SkillGapsSkeleton />}>
        <SkillGapsContent userId={session.user.id} filters={filters} />
      </Suspense>
    </div>
  )
}

async function SkillGapsContent({ userId, filters }: { userId: string, filters?: GapAnalysisFiltersInput }) {
  // Fetch data in parallel
  const [analysis, recommendations, skills] = await Promise.all([
    analyzeUserSkillGaps(userId, filters),
    getTrainingRecommendations(userId),
    prisma.skill.findMany({
      include: {
        category: true,
      },
      orderBy: { name: 'asc' }
    })
  ])

  const { 
    skillGaps, 
    totalSkills, 
    criticalGapsCount, 
    highGapsCount,
    mediumGapsCount,
    lowGapsCount,
    completedSkillsCount, 
    averageGapPercentage,
    gapsByCategory 
  } = analysis

  // Check if user has any skills
  if (totalSkills === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RiBookOpenLine className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Skills Tracked Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start by adding skills to your skill matrix to track your development progress.
          </p>
          <AddSkillDialog skills={skills} />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Add More Skills Button */}
      <div className="flex justify-end">
        <AddSkillDialog skills={skills} />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills Tracked</CardTitle>
            <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSkills}</div>
            <p className="text-xs text-muted-foreground">
              {completedSkillsCount} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <RiErrorWarningLine className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalGapsCount}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Gap</CardTitle>
            <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGapPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all tracked skills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Mastered</CardTitle>
            <RiCheckboxCircleLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedSkillsCount}</div>
            <p className="text-xs text-muted-foreground">
              At desired competency level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gap Category Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Gap Categories</CardTitle>
          <CardDescription>Understanding gap severity levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600 hover:bg-red-700 text-white">Critical (&gt;50%)</Badge>
              <span className="text-sm text-muted-foreground">{criticalGapsCount} skills</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500 hover:bg-orange-600">High (30-50%)</Badge>
              <span className="text-sm text-muted-foreground">{highGapsCount} skills</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium (15-30%)</Badge>
              <span className="text-sm text-muted-foreground">{mediumGapsCount} skills</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 hover:bg-blue-600">Low (&lt;15%)</Badge>
              <span className="text-sm text-muted-foreground">{lowGapsCount} skills</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 hover:bg-green-600">None (0%)</Badge>
              <span className="text-sm text-muted-foreground">{completedSkillsCount} skills</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="gaps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gaps">Skill Gaps ({skillGaps.length})</TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommended Trainings ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Skill Gaps Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <SkillGapFilters />
          <SkillGapsTable skillGaps={skillGaps} userId={userId} />
        </TabsContent>

        {/* Recommended Trainings Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length > 0 ? (
            <TrainingRecommendationsList recommendations={recommendations} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <RiCheckboxCircleLine className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Skills Up to Date!</h3>
                <p className="text-muted-foreground">
                  Great job! You're at your desired competency level for all tracked skills.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gap Distribution by Category</CardTitle>
                <CardDescription>Average gap percentage across skill categories</CardDescription>
              </CardHeader>
              <CardContent>
                <GapDistributionChart gapsByCategory={gapsByCategory} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competency Levels</CardTitle>
                <CardDescription>Current vs Desired competency across all skills</CardDescription>
              </CardHeader>
              <CardContent>
                <CompetencyRadarChart skillGaps={skillGaps} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

function SkillGapsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="py-12">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  )
}
