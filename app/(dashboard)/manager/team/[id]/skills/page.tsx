import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserSkillManagement } from "@/components/dashboard/skills/UserSkillManagement"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { RiArrowLeftLine, RiUserLine } from "@remixicon/react"

interface ManagerTeamMemberSkillsPageProps {
  params: Promise<{ id: string }>
}

export default async function ManagerTeamMemberSkillsPage({ params }: ManagerTeamMemberSkillsPageProps) {
  const session = await auth()
  
  if (!session?.user?.systemRoles?.includes("MANAGER")) {
    redirect("/unauthorized")
  }

  const { id: userId } = await params

  // Verify this user is a reportee
  const user = await prisma.user.findFirst({
    where: { 
      id: userId,
      managerId: session.user.id 
    },
    include: {
      assignedRole: {
        select: {
          name: true,
          department: true,
        }
      }
    }
  })

  if (!user) {
    redirect("/manager/team")
  }

  // Fetch user's skill matrix
  const skillMatrix = await prisma.skillMatrix.findMany({
    where: { userId },
    include: {
      skill: {
        include: {
          category: true,
        }
      }
    },
    orderBy: { skill: { name: "asc" } }
  })

  // Fetch all available skills
  const availableSkills = await prisma.skill.findMany({
    include: {
      category: true,
    },
    orderBy: { name: "asc" }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/manager/team">
              <RiArrowLeftLine className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Skill Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage skills and competency levels for {user.name}
            </p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-lg">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <RiUserLine className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{user.email}</span>
            {user.assignedRole && (
              <>
                <span>•</span>
                <Badge variant="outline">
                  {user.assignedRole.name} - {user.assignedRole.department}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Skill Management Component */}
      <UserSkillManagement
        userId={userId}
        userName={user.name || "User"}
        skillMatrix={skillMatrix}
        availableSkills={availableSkills}
        isManager
      />
    </div>
  )
}
