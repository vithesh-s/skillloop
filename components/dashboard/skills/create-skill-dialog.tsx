"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSkill, type SkillFormState } from "@/actions/skills";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CategoryCombobox } from "./category-combobox";
import { RiAddLine, RiLoader4Line } from "@remixicon/react";
import { toast } from "sonner";

const initialState: SkillFormState = {};

export function CreateSkillDialog() {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [state, formAction, isPending] = useActionState(
    createSkill,
    initialState
  );
  const router = useRouter();

  // Handle success
  useEffect(() => {
    if (state.success && open) {
      toast.success(state.message);
      setOpen(false);
      router.refresh();
    }
  }, [state.success, state.message, open, router]);

  // Handle errors
  useEffect(() => {
    if (state.message && !state.success && open) {
      toast.error(state.message);
    }
  }, [state.message, state.success, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <RiAddLine className="mr-2 h-4 w-4" />
          Create Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-131.25 dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Create New Skill</DialogTitle>
        </DialogHeader>
        {state.message && !state.success && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-400 font-medium">
              {state.message}
            </p>
            {state.errors && Object.keys(state.errors).length > 0 && (
              <ul className="mt-2 text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                {Object.entries(state.errors).map(([field, messages]) => (
                  messages?.map((msg, idx) => (
                    <li key={`${field}-${idx}`}>
                      <span className="font-medium capitalize">{field}:</span> {msg}
                    </li>
                  ))
                ))}
              </ul>
            )}
          </div>
        )}
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="dark:text-slate-200">
              Skill Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., React.js, Python, Communication"
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
            />
            {state.errors?.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.errors.name[0]}
              </p>
            )}
          </div>

          <CategoryCombobox
            value={categoryId}
            onValueChange={setCategoryId}
            required
            error={state.errors?.categoryId?.[0]}
          />

          <div className="space-y-2">
            <Label htmlFor="description" className="dark:text-slate-200">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the skill and its applications..."
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              rows={3}
            />
            {state.errors?.description && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Skill"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
