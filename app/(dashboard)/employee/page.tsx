import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiBookLine, RiTrophyLine, RiUserLine, RiBarChartLine } from "@remixicon/react";
import { AddSkillDialog } from "@/components/dashboard/skills/AddSkillDialog";
import Link from "next/link";

export default async function EmployeeDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const userRoles = user.systemRoles || [];
  const userId = user.id;

  // Fetch dashboard data
  const [skillMatrixData, assessmentData, trainingData, skills, ownedTrainings] = await Promise.all([
    prisma.skillMatrix.findMany({
      where: { userId },
      select: {
        id: true,
        gapPercentage: true,
        status: true,
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
          }
        }
      }
    }),
    prisma.assessmentAttempt.findMany({
      where: {
        userId,
        status: 'completed'
      },
      select: {
        id: true,
        completedAt: true,
        score: true,
        percentage: true,
        assessment: {
          select: {
            title: true,
            skill: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: 5
    }),
    prisma.trainingAssignment.findMany({
      where: {
        userId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        status: true,
        training: {
          select: {
            topicName: true,
            mode: true,
          }
        }
      }
    }),
    prisma.skill.findMany({
      include: {
        category: true,
      },
      orderBy: { name: 'asc' }
    }),
    prisma.training.findMany({
      where: {
        assessmentOwnerId: userId
      },
      select: {
        id: true
      }
    })
  ]);

  // Calculate statistics
  const totalSkills = skillMatrixData.length;
  const completedSkills = skillMatrixData.filter(s => s.gapPercentage === 0).length;
  const skillsWithGaps = totalSkills - completedSkills;
  const completedAssessments = assessmentData.length;
  const activeTrainings = trainingData.length;
  const assessmentDuties = ownedTrainings.length;
  
  // Calculate overall progress
  const overallProgress = totalSkills > 0 
    ? Math.round((completedSkills / totalSkills) * 100)
    : 0;

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
            <div className="text-2xl font-bold">{totalSkills}</div>
            <p className="text-xs text-muted-foreground">
              {skillsWithGaps > 0 ? `${skillsWithGaps} with gaps` : 'Skills tracked'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <RiTrophyLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssessments}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training</CardTitle>
            <RiUserLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrainings}</div>
            <p className="text-xs text-muted-foreground">Active trainings</p>
          </CardContent>
        </Card>

        <Link href="/employee/assessment-duties" className={assessmentDuties > 0 ? '' : 'opacity-60'}>
          <Card className={assessmentDuties > 0 ? 'border-blue-200 bg-blue-50/30 hover:shadow-md transition-shadow cursor-pointer' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessment Duties</CardTitle>
              <RiBarChartLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessmentDuties}</div>
              <p className="text-xs text-muted-foreground">
                {assessmentDuties > 0 ? 'Trainings to assess' : 'No duties assigned'}
              </p>
            </CardContent>
          </Card>
        </Link>
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
            {assessmentData.length > 0 ? (
              <div className="space-y-3">
                {assessmentData.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{attempt.assessment.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.assessment.skill?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{attempt.percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <RiBarChartLine className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p>No recent activity</p>
                <p className="text-sm mt-2">Start learning to see your progress here</p>
              </div>
            )}
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
            <AddSkillDialog 
              skills={skills}
              variant="outline"
              className="h-auto flex-col items-start p-4 gap-2 w-full"
              buttonText="Add Skills"
            />

            <Link href="/employee/assessments" className="w-full">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4 gap-2">
                <RiTrophyLine className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-semibold">Take Assessment</p>
                  <p className="text-xs text-muted-foreground">Test your knowledge</p>
                </div>
              </Button>
            </Link>

            <Link href="/employee/skill-gaps" className="w-full">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4 gap-2">
                <RiBarChartLine className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-semibold">View My Skills</p>
                  <p className="text-xs text-muted-foreground">Track your progress</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
