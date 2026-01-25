import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSkills } from "@/actions/skills";
import { SkillsTable } from "@/components/dashboard/skills/skills-table";
import { CreateSkillDialog } from "@/components/dashboard/skills/create-skill-dialog";
import { SkillsFilters } from "@/components/dashboard/skills/skills-filters";
import { Button } from "@/components/ui/button";
import { RiAddLine } from "@remixicon/react";

interface SkillsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const { skills, total, pages, currentPage } = await getSkills({
    category: params.category,
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Skills Management
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Manage your organization's skill catalog and categories
          </p>
        </div>
        <CreateSkillDialog />
      </div>

      <SkillsFilters />

      <SkillsTable
        skills={skills}
        total={total}
        pages={pages}
        currentPage={currentPage}
      />
    </div>
  );
}
