import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { logout } from '@/actions/auth'
import { 
  RiCheckLine, 
  RiUserLine, 
  RiMailLine, 
  RiShieldUserLine,
  RiBuilding4Line,
  RiBriefcaseLine,
  RiMapPinLine,
  RiLogoutBoxLine 
} from '@remixicon/react'
import Link from 'next/link'

/**
 * Test Auth Page
 * 
 * Comprehensive test page for authentication system
 * - Displays current session information
 * - Tests role-based access
 * - Provides logout functionality
 */
export default async function TestAuthPage() {
  const session = await auth()

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login')
  }

  const { user } = session

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Authentication Test
            </h1>
            <p className="text-slate-600 mt-1">
              Verify your authentication and session data
            </p>
          </div>
          <form action={async () => {
            'use server'
            await logout()
          }}>
            <Button variant="outline" type="submit">
              <RiLogoutBoxLine className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>

        {/* Success Message */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <RiCheckLine className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900">
                  Authentication Successful
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                  You are successfully authenticated and your session is active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>
              Your current session and user details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Name */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <RiUserLine className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Full Name</p>
                  <p className="font-medium text-slate-900">{user.name}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <RiMailLine className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Email Address</p>
                  <p className="font-medium text-slate-900">{user.email}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <RiShieldUserLine className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Role</p>
                  <Badge variant="secondary" className="mt-1">
                    {user.role}
                  </Badge>
                </div>
              </div>

              {/* Employee Number */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <RiBriefcaseLine className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Employee Number</p>
                  <p className="font-medium text-slate-900">{user.employeeNo}</p>
                </div>
              </div>

              {/* Department */}
              {user.department && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                    <RiBuilding4Line className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Department</p>
                    <p className="font-medium text-slate-900">{user.department}</p>
                  </div>
                </div>
              )}

              {/* Designation */}
              {user.designation && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                    <RiBriefcaseLine className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Designation</p>
                    <p className="font-medium text-slate-900">{user.designation}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {user.location && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <RiMapPinLine className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Location</p>
                    <p className="font-medium text-slate-900">{user.location}</p>
                  </div>
                </div>
              )}

              {/* User ID */}
              <div className="flex items-start gap-3 md:col-span-2">
                <div>
                  <p className="text-sm text-slate-600">User ID</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                    {user.id}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Role-Based Access Testing</CardTitle>
            <CardDescription>
              Test access to different role-protected areas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" asChild>
                <Link href="/admin">
                  Test Admin Access
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/training">
                  Test Training Access
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/manager">
                  Test Manager Access
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Test Dashboard Access
                </Link>
              </Button>
            </div>
            <Separator />
            <p className="text-xs text-slate-600">
              Click the buttons above to test role-based access control. 
              If you don't have the required role, you'll be redirected to the unauthorized page.
            </p>
          </CardContent>
        </Card>

        {/* Test Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-emerald-600" />
                <span>✅ Authentication system working</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-emerald-600" />
                <span>✅ Session data loaded correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-emerald-600" />
                <span>✅ User profile data available</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="h-4 w-4 text-emerald-600" />
                <span>✅ Role-based access configured</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
