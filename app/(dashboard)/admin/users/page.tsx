import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/actions/users";
import { UsersTable } from "@/components/dashboard/users/users-table";
import { CreateUserDialog } from "@/components/dashboard/users/create-user-dialog";
import { UsersFilters } from "@/components/dashboard/users/users-filters";

interface UsersPageProps {
  searchParams: Promise<{
    role?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const { users, total, pages, currentPage } = await getUsers({
    role: params.role,
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage user accounts and permissions
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <UsersFilters />

      <UsersTable
        users={users}
        total={total}
        pages={pages}
        currentPage={currentPage}
      />
    </div>
  );
}
