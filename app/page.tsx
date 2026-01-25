import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RiDashboardLine, 
  RiUserLine, 
  RiBookOpenLine,
  RiTeamLine,
  RiSettings4Line,
  RiTestTubeLine
} from '@remixicon/react'
import Link from 'next/link'
import { logout } from '@/actions/auth'

/**
 * Dashboard Home Page
 * 
 * Main entry point after authentication
 * Shows role-based navigation and quick actions
 */
export default async function Page() {
  const session = await auth()

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login')
  }

  const { user } = session
  const isAdmin = user.systemRoles.includes('ADMIN')
  const isTrainer = user.systemRoles.includes('TRAINER') || isAdmin
  const isManager = user.systemRoles.includes('MANAGER') || isAdmin

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">SL</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Skill Loop</h1>
                <p className="text-xs text-slate-600">Employee Skill Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <div className="flex gap-1 justify-end">
                  {user.systemRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <form action={async () => {
                'use server'
                await logout()
              }}>
                <Button variant="outline" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user.name?.split(' ')[0]}! 👋</CardTitle>
              <CardDescription>
                Employee No: {user.employeeNo} • {user.designation || 'Employee'} • {user.department || 'Department'}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Dashboard */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <RiDashboardLine className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Dashboard</CardTitle>
                      <CardDescription className="text-xs">
                        View your overview
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* My Skills */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <RiUserLine className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">My Skills</CardTitle>
                      <CardDescription className="text-xs">
                        Manage your skills
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Training */}
              {isTrainer && (
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <RiBookOpenLine className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Training</CardTitle>
                        <CardDescription className="text-xs">
                          Manage training programs
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {/* Team Management */}
              {isManager && (
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <RiTeamLine className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">My Team</CardTitle>
                        <CardDescription className="text-xs">
                          View team skills
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {/* Admin Settings */}
              {isAdmin && (
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <RiSettings4Line className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Admin</CardTitle>
                        <CardDescription className="text-xs">
                          System settings
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {/* Test Auth */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-slate-300">
                <Link href="/test-auth">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <RiTestTubeLine className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Test Auth</CardTitle>
                        <CardDescription className="text-xs">
                          Verify authentication
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Overview</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Skills</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Certifications</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Training Hours</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending Reviews</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}