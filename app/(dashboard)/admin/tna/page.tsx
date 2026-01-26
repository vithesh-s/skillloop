import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { generateOrganizationTNA } from '@/actions/skill-matrix'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  RiDownloadLine,
  RiBarChartBoxLine,
  RiErrorWarningLine,
  RiTeamLine,
  RiUserLine
} from '@remixicon/react'
import { OrganizationGapChart } from '@/components/dashboard/tna/OrganizationGapChart'
import { TopGapSkillsTable } from '@/components/dashboard/tna/TopGapSkillsTable'
import { DepartmentTNAList } from '@/components/dashboard/tna/DepartmentTNAList'
import { EmployeeTNATable } from '@/components/dashboard/tna/EmployeeTNATable'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TNAPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Check authorization
  const isAdmin = session.user.systemRoles?.includes('ADMIN')
  const isManager = session.user.systemRoles?.includes('MANAGER')

  if (!isAdmin && !isManager) {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Need Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Organization-wide skill gap analysis and training recommendations
          </p>
        </div>
        <Button>
          <RiDownloadLine className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Suspense boundary for data fetching */}
      <Suspense fallback={<TNASkeleton />}>
        <TNAContent isAdmin={isAdmin} />
      </Suspense>
    </div>
  )
}

async function TNAContent({ isAdmin }: { isAdmin: boolean }) {
  // Fetch organization TNA
  const tna = await generateOrganizationTNA()

  const {
    totalEmployees,
    totalSkillsTracked,
    organizationGapScore,
    criticalGapsTotal,
    highGapsTotal,
    mediumGapsTotal,
    lowGapsTotal,
    departmentBreakdown,
    roleBreakdown,
    topGapSkills,
    employeeTNAs,
  } = tna

  return (
    <>
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <RiUserLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Tracked</CardTitle>
            <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSkillsTracked}</div>
            <p className="text-xs text-muted-foreground">
              Organization-wide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Gap Score</CardTitle>
            <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizationGapScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Organization average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <RiErrorWarningLine className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalGapsTotal}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gap Distribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Gap Distribution</CardTitle>
          <CardDescription>Breakdown of skill gaps across severity levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Critical</Badge>
              <span className="text-sm text-muted-foreground">{criticalGapsTotal} gaps</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500">High</Badge>
              <span className="text-sm text-muted-foreground">{highGapsTotal} gaps</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500">Medium</Badge>
              <span className="text-sm text-muted-foreground">{mediumGapsTotal} gaps</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">Low</Badge>
              <span className="text-sm text-muted-foreground">{lowGapsTotal} gaps</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Organization Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments ({departmentBreakdown.length})</TabsTrigger>
          <TabsTrigger value="employees">Employees ({employeeTNAs.length})</TabsTrigger>
        </TabsList>

        {/* Organization Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <RiUserLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  Across all departments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skills Tracked</CardTitle>
                <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSkillsTracked}</div>
                <p className="text-xs text-muted-foreground">
                  Organization-wide
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Gap Score</CardTitle>
                <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organizationGapScore.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Organization average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
                <RiErrorWarningLine className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{criticalGapsTotal}</div>
                <p className="text-xs text-muted-foreground">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gap Distribution Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Gap Distribution</CardTitle>
              <CardDescription>Breakdown of skill gaps across severity levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Critical</Badge>
                  <span className="text-sm text-muted-foreground">{criticalGapsTotal} gaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-500">High</Badge>
                  <span className="text-sm text-muted-foreground">{highGapsTotal} gaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500">Medium</Badge>
                  <span className="text-sm text-muted-foreground">{mediumGapsTotal} gaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">Low</Badge>
                  <span className="text-sm text-muted-foreground">{lowGapsTotal} gaps</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gap Distribution by Department</CardTitle>
                <CardDescription>Average gap scores across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationGapChart departmentBreakdown={departmentBreakdown} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Gap Skills</CardTitle>
                <CardDescription>Skills with highest average gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <TopGapSkillsTable topGapSkills={topGapSkills.slice(0, 10)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <DepartmentTNAList departments={departmentBreakdown} />
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <EmployeeTNATable employeeTNAs={employeeTNAs} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function TNASkeleton() {
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
