"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRole } from "@/actions/roles";
import { EditRoleDialog } from "./edit-role-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiUserLine,
  RiBookLine,
} from "@remixicon/react";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  department: string;
  level: string;
  description: string | null;
  createdAt: Date;
  _count: {
    competencies: number;
    users: number;
  };
}

interface RolesTableProps {
  roles: Role[];
  total: number;
  pages: number;
  currentPage: number;
}

const levelColors: Record<string, string> = {
  ENTRY: "bg-green-100 text-green-700",
  MID: "bg-blue-100 text-blue-700",
  SENIOR: "bg-purple-100 text-purple-700",
  LEAD: "bg-orange-100 text-orange-700",
};

export function RolesTable({
  roles,
  total,
  pages,
  currentPage,
}: RolesTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedRole) return;

    setIsDeleting(true);
    const result = await deleteRole(selectedRole.id);

    if (result.success) {
      toast.success(result.message);
      setDeleteDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setIsDeleting(false);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    router.push(`/admin/roles?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Competencies</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{role.name}</p>
                    {role.description && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {role.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{role.department}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={levelColors[role.level]}
                  >
                    {role.level}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <RiBookLine className="h-4 w-4" />
                    {role._count.competencies}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <RiUserLine className="h-4 w-4" />
                    {role._count.users}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(role.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <RiMoreLine className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRole(role);
                          setEditDialogOpen(true);
                        }}
                      >
                        <RiEditLine className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedRole(role);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <RiDeleteBinLine className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * 10 + 1} to{" "}
          {Math.min(currentPage * 10, total)} of {total} roles
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <RiArrowLeftLine className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pages}
          >
            <RiArrowRightLine className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedRole?.name}"? This
              action cannot be undone and will affect all users assigned to this
              role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {selectedRole && (
        <EditRoleDialog
          roleId={selectedRole.id}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </div>
  );
}
