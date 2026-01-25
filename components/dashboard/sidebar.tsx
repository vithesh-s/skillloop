"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  RiDashboardLine,
  RiBookLine,
  RiShieldUserLine,
  RiUserLine,
  RiSettings3Line,
  RiGraduationCapLine,
  RiFileChartLine,
  RiFolderLine,
} from "@remixicon/react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    systemRoles?: string[] | null;
  };
}

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: RiDashboardLine,
  },
  {
    title: "Skills Management",
    href: "/admin/skills",
    icon: RiBookLine,
  },
  {
    title: "Role Framework",
    href: "/admin/roles",
    icon: RiShieldUserLine,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: RiUserLine,
  },
  {
    title: "System Config",
    href: "/admin/config",
    icon: RiSettings3Line,
  },
];

const trainerNavItems = [
  {
    title: "Dashboard",
    href: "/trainer",
    icon: RiDashboardLine,
  },
  {
    title: "Training Programs",
    href: "/trainer/programs",
    icon: RiGraduationCapLine,
  },
  {
    title: "Assessments",
    href: "/trainer/assessments",
    icon: RiFileChartLine,
  },
];

const managerNavItems = [
  {
    title: "Dashboard",
    href: "/manager",
    icon: RiDashboardLine,
  },
  {
    title: "Team Overview",
    href: "/manager/team",
    icon: RiUserLine,
  },
  {
    title: "Reports",
    href: "/manager/reports",
    icon: RiFileChartLine,
  },
];

const employeeNavItems = [
  {
    title: "Dashboard",
    href: "/employee",
    icon: RiDashboardLine,
  },
  {
    title: "My Skills",
    href: "/employee/skills",
    icon: RiBookLine,
  },
  {
    title: "Learning Path",
    href: "/employee/learning",
    icon: RiGraduationCapLine,
  },
  {
    title: "Assessments",
    href: "/employee/assessments",
    icon: RiFileChartLine,
  },
];

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  // Determine which dashboard we're currently on based on the pathname
  const currentDashboard = pathname.startsWith('/admin') 
    ? 'admin' 
    : pathname.startsWith('/trainer')
    ? 'trainer'
    : pathname.startsWith('/manager')
    ? 'manager'
    : pathname.startsWith('/employee')
    ? 'employee'
    : 'admin'; // default fallback

  // Select navigation items based on current dashboard
  const navItems =
    currentDashboard === "admin"
      ? adminNavItems
      : currentDashboard === "trainer"
        ? trainerNavItems
        : currentDashboard === "manager"
        ? managerNavItems
        : employeeNavItems;

  // Get the current role label to display
  const currentRoleLabel = 
    currentDashboard === "admin" 
      ? "Admin" 
      : currentDashboard === "trainer"
      ? "Trainer"
      : currentDashboard === "manager"
      ? "Manager"
      : "Employee";

  return (
    <aside className="flex w-64 flex-col border-r bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex h-16 items-center border-b dark:border-slate-800 px-6">
        <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">SkillLoop</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t dark:border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium dark:text-white">{user.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-slate-400">{currentRoleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
