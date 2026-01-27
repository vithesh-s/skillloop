"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteUser } from "@/actions/users";
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
import { Progress } from "@/components/ui/progress";
import { UserDialog } from "./user-dialog";
import {
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiEyeLine,
} from "@remixicon/react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  systemRoles: string[];
  createdAt: Date;
  assignedRole: {
    name: string;
    department: string;
  } | null;
  journey: {
    id: string;
    status: string;
    employeeType: string;
    userId: string;
    startedAt: Date;
    completedAt: Date | null;
    cycleNumber: number;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      phases: number;
    };
    phases: Array<{ id: string }>;
  } | null;
  currentPhase: {
    id: string;
    title: string;
    phaseNumber: number;
    phaseType: string;
    status: string;
  } | null;
}

interface UsersTableProps {
  users: User[];
  total: number;
  pages: number;
  currentPage: number;
  employeeTypeFilter?: string;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  TRAINER: "bg-blue-100 text-blue-700",
  MANAGER: "bg-purple-100 text-purple-700",
  EMPLOYEE: "bg-green-100 text-green-700",
};

const journeyStatusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  NOT_STARTED: "bg-gray-100 text-gray-700",
};

export function UsersTable({
  users,
  total,
  pages,
  currentPage,
  employeeTypeFilter,
}: UsersTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const filteredUsers = employeeTypeFilter
    ? users.filter((user) => user.journey?.employeeType === employeeTypeFilter)
    : users;

  const handleDelete = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    const result = await deleteUser(selectedUser.id);

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
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Job Role</TableHead>
              <TableHead>Employee Type</TableHead>
              <TableHead>Current Phase</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-medium">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.systemRoles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className={roleColors[role]}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {user.assignedRole ? (
                    <div>
                      <p className="text-sm font-medium">
                        {user.assignedRole.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.assignedRole.department}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.journey ? (
                    <Badge variant="secondary" className={journeyStatusColors[user.journey.status]}>
                      {user.journey.employeeType.replace("_", " ")}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.currentPhase ? (
                    <div className="max-w-50">
                      <p className="text-sm font-medium truncate">
                        {user.currentPhase.title}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Phase {user.currentPhase.phaseNumber}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.journey ? (
                    <div className="min-w-30">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(user.journey.phases.length / user.journey._count.phases) * 100} 
                          className="h-2" 
                        />
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {user.journey.phases.length}/{user.journey._count.phases}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {user.journey && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/users/${user.id}/journey`}>
                          <RiEyeLine className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <RiMoreLine className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setEditDialogOpen(true);
                          }}
                        >
                          <RiEditLine className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedUser(user);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <RiDeleteBinLine className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
          {Math.min(currentPage * 10, total)} of {total} users
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
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedUser?.name}"? This
              action cannot be undone and will remove all associated data.
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
      <UserDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        user={selectedUser} 
      />
    </div>
  );
}
