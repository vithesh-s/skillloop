import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/actions/users";
import { UsersTable } from "@/components/dashboard/users/users-table";
import { CreateUserDialog } from "@/components/dashboard/users/create-user-dialog";
import { UsersFilters } from "@/components/dashboard/users/users-filters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UsersPageProps {
  searchParams: Promise<{
    role?: string;
    search?: string;
    page?: string;
    employeeType?: string;
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

      <Tabs defaultValue={params.employeeType || "all"} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="NEW_EMPLOYEE">New Employees</TabsTrigger>
          <TabsTrigger value="EXISTING_EMPLOYEE">Existing Employees</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <UsersTable
            users={users}
            total={total}
            pages={pages}
            currentPage={currentPage}
          />
        </TabsContent>
        
        <TabsContent value="NEW_EMPLOYEE" className="mt-6">
          <UsersTable
            users={users}
            total={total}
            pages={pages}
            currentPage={currentPage}
            employeeTypeFilter="NEW_EMPLOYEE"
          />
        </TabsContent>
        
        <TabsContent value="EXISTING_EMPLOYEE" className="mt-6">
          <UsersTable
            users={users}
            total={total}
            pages={pages}
            currentPage={currentPage}
            employeeTypeFilter="EXISTING_EMPLOYEE"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
