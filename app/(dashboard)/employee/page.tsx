import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiBookLine, RiTrophyLine, RiUserLine, RiBarChartLine } from "@remixicon/react";

export default async function EmployeeDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const userRoles = user.systemRoles || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name}!</h1>
          <p className="text-slate-600 mt-1">Here's your learning dashboard</p>
        </div>
        <div className="flex gap-2">
          {userRoles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Skills</CardTitle>
            <RiBookLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Skills tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <RiTrophyLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training</CardTitle>
            <RiUserLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active trainings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <RiBarChartLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* My Learning Path */}
        <Card>
          <CardHeader>
            <CardTitle>My Learning Path</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <RiBookLine className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p>No learning paths assigned yet</p>
              <p className="text-sm mt-2">Check back later for personalized learning recommendations</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <RiBarChartLine className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p>No recent activity</p>
              <p className="text-sm mt-2">Start learning to see your progress here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
              <RiBookLine className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Browse Skills</p>
                <p className="text-xs text-muted-foreground">Explore available skills</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
              <RiTrophyLine className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Take Assessment</p>
                <p className="text-xs text-muted-foreground">Test your knowledge</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
              <RiUserLine className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">View Profile</p>
                <p className="text-xs text-muted-foreground">Update your information</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
