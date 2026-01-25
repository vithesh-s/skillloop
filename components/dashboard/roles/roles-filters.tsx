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

export function RolesFilters() {
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
    router.push(`/admin/roles?${params.toString()}`);
  };

  const handleLevelChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("level", value);
    } else {
      params.delete("level");
    }
    params.delete("page");
    router.push(`/admin/roles?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <RiSearchLine className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search roles..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        defaultValue={searchParams.get("level") || "all"}
        onValueChange={handleLevelChange}
      >
        <SelectTrigger className="w-50">
          <SelectValue placeholder="All levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="ENTRY">Entry Level</SelectItem>
          <SelectItem value="MID">Mid Level</SelectItem>
          <SelectItem value="SENIOR">Senior Level</SelectItem>
          <SelectItem value="LEAD">Lead Level</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
