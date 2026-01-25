import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RiUserLine,
  RiBookLine,
  RiShieldUserLine,
  RiGraduationCapLine,
} from "@remixicon/react";

async function getDashboardStats() {
  const [usersCount, skillsCount, rolesCount, activeTrainingsCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.skill.count(),
      prisma.jobRole.count(),
      prisma.training.count(),
    ]);

  return {
    usersCount,
    skillsCount,
    rolesCount,
    activeTrainingsCount,
  };
}

async function getRecentActivities() {
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      systemRoles: true,
      createdAt: true,
    },
  });

  const recentSkills = await prisma.skill.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      category: {
        select: {
          name: true,
        },
      },
      createdAt: true,
    },
  });

  return {
    recentUsers,
    recentSkills,
  };
}

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const stats = await getDashboardStats();
  const activities = await getRecentActivities();

  const statCards = [
    {
      title: "Total Users",
      value: stats.usersCount,
      icon: RiUserLine,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Skills Catalog",
      value: stats.skillsCount,
      icon: RiBookLine,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Role Frameworks",
      value: stats.rolesCount,
      icon: RiShieldUserLine,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Active Trainings",
      value: stats.activeTrainingsCount,
      icon: RiGraduationCapLine,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-gray-600">
          Here's what's happening in your organization today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} rounded-lg p-2`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-medium">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {user.systemRoles.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.recentSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-sm text-gray-500">{skill.category.name}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(skill.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
