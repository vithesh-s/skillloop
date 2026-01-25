import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RiShieldCrossLine } from '@remixicon/react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Unauthorized Page
 * 
 * Displayed when user tries to access a resource they don't have permission for
 */
export default async function UnauthorizedPage() {
  const session = await auth()

  // If not logged in, redirect to login
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <RiShieldCrossLine className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Your Role:</span>
              <span className="font-medium text-slate-900">
                {session.user.role}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Employee No:</span>
              <span className="font-medium text-slate-900">
                {session.user.employeeNo}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 text-center">
            If you believe you should have access to this resource, please contact your administrator.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/">Go to Dashboard</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/login">Sign Out</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
