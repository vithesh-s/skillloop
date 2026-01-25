import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRoles } from "@/actions/roles";
import { RolesTable } from "@/components/dashboard/roles/roles-table";
import { CreateRoleDialog } from "@/components/dashboard/roles/create-role-dialog";
import { RolesFilters } from "@/components/dashboard/roles/roles-filters";

interface RolesPageProps {
  searchParams: Promise<{
    department?: string;
    level?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const { roles, total, pages, currentPage } = await getRoles({
    department: params.department,
    level: params.level,
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Role Competency Framework
          </h1>
          <p className="text-gray-600">
            Define roles and their required skill competencies
          </p>
        </div>
        <CreateRoleDialog />
      </div>

      <RolesFilters />

      <RolesTable
        roles={roles}
        total={total}
        pages={pages}
        currentPage={currentPage}
      />
    </div>
  );
}
