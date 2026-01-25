"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiSearchLine } from "@remixicon/react";
import { getCategories } from "@/actions/categories";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  colorClass: string;
  _count: {
    skills: number;
  };
}

export function SkillsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page"); // Reset to first page
    router.push(`/admin/skills?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    params.delete("page"); // Reset to first page
    router.push(`/admin/skills?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <RiSearchLine className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
        <Input
          placeholder="Search skills..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        />
      </div>
      <Select
        defaultValue={searchParams.get("category") || "all"}
        onValueChange={handleCategoryChange}
        disabled={loading}
      >
        <SelectTrigger className="w-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          <SelectValue placeholder={loading ? "Loading..." : "All categories"} />
        </SelectTrigger>
        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
          <SelectItem value="all" className="dark:hover:bg-slate-800">
            All Categories
          </SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category.id}
              value={category.id}
              className="dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full bg-${category.colorClass}`} />
                <span>{category.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  ({category._count.skills})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
