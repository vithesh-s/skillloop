"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RiLogoutBoxLine, RiUserLine, RiDashboardLine } from "@remixicon/react";
import Link from "next/link";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    systemRoles?: string[];
  };
}

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/skills": "Skills Management",
  "/admin/roles": "Role Framework",
  "/admin/users": "User Management",
  "/admin/config": "System Configuration",
  "/trainer": "Trainer Dashboard",
  "/trainer/programs": "Training Programs",
  "/trainer/assessments": "Assessments",
  "/manager": "Manager Dashboard",
  "/manager/team": "Team Overview",
  "/manager/reports": "Reports",
};

export function DashboardHeader({ user }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = breadcrumbMap[pathname] || "Dashboard";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-slate-900 px-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            suppressHydrationWarning
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs font-normal text-gray-500">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Role-based Dashboard Navigation */}
          {user.systemRoles && user.systemRoles.length > 1 && (
            <>
              <DropdownMenuLabel className="text-xs text-gray-500">
                Switch Dashboard
              </DropdownMenuLabel>
              {user.systemRoles.includes('ADMIN') && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <RiDashboardLine className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {user.systemRoles.includes('MANAGER') && (
                <DropdownMenuItem asChild>
                  <Link href="/manager">
                    <RiDashboardLine className="mr-2 h-4 w-4" />
                    Manager Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {user.systemRoles.includes('TRAINER') && (
                <DropdownMenuItem asChild>
                  <Link href="/trainer">
                    <RiDashboardLine className="mr-2 h-4 w-4" />
                    Trainer Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {user.systemRoles.includes('LEARNER') && (
                <DropdownMenuItem asChild>
                  <Link href="/employee">
                    <RiDashboardLine className="mr-2 h-4 w-4" />
                    Employee Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem>
            <RiUserLine className="mr-2 h-4 w-4" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <RiLogoutBoxLine className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
