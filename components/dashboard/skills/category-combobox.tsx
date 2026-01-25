"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RiCheckLine, RiAddLine, RiArrowDownSLine } from "@remixicon/react";
import { getCategories, createCategoryByName } from "@/actions/categories";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  colorClass: string;
  _count?: {
    skills: number;
  };
}

interface CategoryComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  required?: boolean;
  error?: string;
  label?: string;
  disabled?: boolean;
}

export function CategoryCombobox({
  value,
  onValueChange,
  defaultValue,
  required = false,
  error,
  label = "Category",
  disabled = false,
}: CategoryComboboxProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || "");
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

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

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  const handleCreateCategory = async () => {
    if (!searchValue.trim()) return;

    setIsCreating(true);
    try {
      const result = await createCategoryByName(searchValue.trim());

      if (result.success && result.categoryId) {
        toast.success(`Category "${searchValue}" created successfully`);
        await loadCategories();
        handleValueChange(result.categoryId);
        setSearchValue("");
        setOpen(false);
      } else {
        toast.error(result.message || "Failed to create category");
      }
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setIsCreating(false);
    }
  };

  // Get selected category name for display
  const selectedCategory = categories.find((cat) => cat.id === selectedValue);

  // Check if search matches existing category
  const exactMatch = categories.find(
    (cat) => cat.name.toLowerCase() === searchValue.toLowerCase()
  );

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showCreateOption = searchValue && !exactMatch && filteredCategories.length === 0;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="category" className="dark:text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
            disabled={disabled}
          >
            {selectedCategory ? (
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full bg-${selectedCategory.colorClass}`}
                />
                {selectedCategory.name}
              </div>
            ) : (
              <span className="text-muted-foreground">Search or create category...</span>
            )}
            <RiArrowDownSLine className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <input
          type="hidden"
          name="categoryId"
          value={selectedValue}
          required={required}
        />
        <PopoverContent className="w-full p-0 dark:bg-slate-900 dark:border-slate-800" align="start">
          <Command className="dark:bg-slate-900">
            <CommandInput
              placeholder="Search or create category..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="dark:text-white"
            />
            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Loading categories...
                  </div>
                ) : showCreateOption ? (
                  <div className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start dark:hover:bg-slate-800"
                      onClick={handleCreateCategory}
                      disabled={isCreating}
                    >
                      <RiAddLine className="mr-2 h-4 w-4" />
                      Create &quot;{searchValue}&quot;
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No categories found
                  </div>
                )}
              </CommandEmpty>
              {!loading && filteredCategories.length > 0 && (
                <CommandGroup>
                  {filteredCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.id}
                      onSelect={(currentValue) => {
                        handleValueChange(currentValue === selectedValue ? "" : currentValue);
                        setOpen(false);
                      }}
                      className="dark:hover:bg-slate-800"
                    >
                      <RiCheckLine
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedValue === category.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span
                        className={`w-2 h-2 rounded-full bg-${category.colorClass} mr-2`}
                      />
                      <span className="dark:text-white">{category.name}</span>
                      {category._count && category._count.skills > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {category._count.skills} skills
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!loading && showCreateOption && filteredCategories.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateCategory}
                    disabled={isCreating}
                    className="dark:hover:bg-slate-800"
                  >
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create &quot;{searchValue}&quot;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
