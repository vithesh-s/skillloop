"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiSearchLine } from "@remixicon/react";

export function UsersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("role", value);
    } else {
      params.delete("role");
    }
    params.delete("page");
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <RiSearchLine className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        defaultValue={searchParams.get("role") || "all"}
        onValueChange={handleRoleChange}
      >
        <SelectTrigger className="w-50">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="TRAINER">Trainer</SelectItem>
          <SelectItem value="MANAGER">Manager</SelectItem>
          <SelectItem value="LEARNER">Learner</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
