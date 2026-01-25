"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSkill } from "@/actions/skills";
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
} from "@remixicon/react";
import { toast } from "sonner";
import { EditSkillDialog } from "./edit-skill-dialog";

interface Skill {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
    colorClass: string;
  };
  description: string | null;
  createdAt: Date;
  _count: {
    roleCompetencies: number;
    skillMatrix: number;
  };
}

interface SkillsTableProps {
  skills: Skill[];
  total: number;
  pages: number;
  currentPage: number;
}

const categoryColors: Record<string, string> = {
  TECHNICAL: "bg-blue-100 text-blue-700",
  SOFT_SKILLS: "bg-green-100 text-green-700",
  LEADERSHIP: "bg-purple-100 text-purple-700",
  COMMUNICATION: "bg-orange-100 text-orange-700",
  DOMAIN_KNOWLEDGE: "bg-pink-100 text-pink-700",
};

export function SkillsTable({
  skills,
  total,
  pages,
  currentPage,
}: SkillsTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedSkill) return;

    setIsDeleting(true);
    const result = await deleteSkill(selectedSkill.id);

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
    router.push(`/admin/skills?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-slate-800">
              <TableHead className="dark:text-slate-200">Skill Name</TableHead>
              <TableHead className="dark:text-slate-200">Category</TableHead>
              <TableHead className="dark:text-slate-200">Description</TableHead>
              <TableHead className="dark:text-slate-200">Users</TableHead>
              <TableHead className="dark:text-slate-200">Roles</TableHead>
              <TableHead className="dark:text-slate-200">Created</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center dark:text-slate-400">
                  No skills found. Create your first skill to get started.
                </TableCell>
              </TableRow>
            ) : (
              skills.map((skill) => (
                <TableRow key={skill.id} className="dark:border-slate-800">
                  <TableCell className="font-medium dark:text-white">
                    {skill.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full bg-${skill.category.colorClass}`}
                      />
                      <span className="dark:text-slate-300">
                        {skill.category.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate dark:text-slate-300">
                    {skill.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="dark:bg-slate-800 dark:text-slate-200"
                    >
                      {skill._count.skillMatrix} users
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="dark:border-slate-700 dark:text-slate-300"
                    >
                      {skill._count.roleCompetencies} roles
                    </Badge>
                  </TableCell>
                  <TableCell className="dark:text-slate-400">
                    {new Date(skill.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="dark:hover:bg-slate-800"
                        >
                          <RiMoreLine className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="dark:bg-slate-900 dark:border-slate-800"
                      >
                        <DropdownMenuItem
                          className="dark:hover:bg-slate-800"
                          onClick={() => {
                            setSelectedSkill(skill);
                            setEditDialogOpen(true);
                          }}
                        >
                          <RiEditLine className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 dark:hover:bg-slate-800"
                          onClick={() => {
                            setSelectedSkill(skill);
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Showing {skills.length === 0 ? 0 : (currentPage - 1) * 10 + 1} to{" "}
          {Math.min(currentPage * 10, total)} of {total} skills
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <RiArrowLeftLine className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pages}
          >
            <RiArrowRightLine className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              Delete Skill
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete "{selectedSkill?.name}"? This
              action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {selectedSkill && (
        <EditSkillDialog
          skill={selectedSkill}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </div>
  );
}
