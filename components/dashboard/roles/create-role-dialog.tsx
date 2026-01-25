"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createRole, type RoleFormState, getAllSkills } from "@/actions/roles";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiAddLine, RiLoader4Line, RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";
import { useEffect } from "react";

const initialState: RoleFormState = {};

interface Competency {
  skillId: string;
  skillName?: string;
  requiredLevel: string;
  priority: "REQUIRED" | "PREFERRED" | "OPTIONAL";
}

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [state, formAction, isPending] = useActionState(
    createRole,
    initialState
  );
  const router = useRouter();

  // Load skills
  useEffect(() => {
    if (open) {
      getAllSkills().then(setSkills);
    }
  }, [open]);

  // Handle success
  useEffect(() => {
    if (state.success && open) {
      toast.success(state.message);
      setOpen(false);
      setCompetencies([]);
      router.refresh();
    }
  }, [state.success, state.message, open, router]);

  // Handle errors
  useEffect(() => {
    if (state.message && !state.success && open) {
      toast.error(state.message);
    }
  }, [state.message, state.success, open]);

  const addCompetency = () => {
    setCompetencies([
      ...competencies,
      {
        skillId: "",
        requiredLevel: "",
        priority: "REQUIRED",
      },
    ]);
  };

  const removeCompetency = (index: number) => {
    setCompetencies(competencies.filter((_, i) => i !== index));
  };

  const updateCompetency = (
    index: number,
    field: keyof Competency,
    value: string
  ) => {
    const updated = [...competencies];
    updated[index] = { ...updated[index], [field]: value };
    setCompetencies(updated);
  };

  const handleSubmit = async (formData: FormData) => {
    formData.set("competencies", JSON.stringify(competencies));
    await formAction(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <RiAddLine className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Senior Software Engineer"
                required
              />
              {state.errors?.name && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.name[0]}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                name="department"
                placeholder="e.g., Engineering"
                required
              />
              {state.errors?.department && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.department[0]}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="level">Level *</Label>
            <Select name="level" required>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRY">Entry Level</SelectItem>
                <SelectItem value="MID">Mid Level</SelectItem>
                <SelectItem value="SENIOR">Senior Level</SelectItem>
                <SelectItem value="LEAD">Lead Level</SelectItem>
              </SelectContent>
            </Select>
            {state.errors?.level && (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.level[0]}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the role..."
              rows={3}
            />
            {state.errors?.description && (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Competencies *</Label>
              <Button type="button" size="sm" onClick={addCompetency}>
                <RiAddLine className="mr-1 h-4 w-4" />
                Add Competency
              </Button>
            </div>

            {competencies.map((comp, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr,1.5fr,1.5fr,auto] gap-2 items-end"
              >
                <div>
                  <Select
                    value={comp.skillId}
                    onValueChange={(value) =>
                      updateCompetency(index, "skillId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={comp.requiredLevel}
                    onValueChange={(value) =>
                      updateCompetency(index, "requiredLevel", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const selectedSkill = skills.find((s) => s.id === comp.skillId);
                        const levels = selectedSkill?.proficiencyLevels;
                        const proficiencyArray = Array.isArray(levels) 
                          ? levels 
                          : ["Beginner", "Intermediate", "Advanced", "Expert"];
                        
                        return proficiencyArray.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={comp.priority}
                    onValueChange={(value) =>
                      updateCompetency(
                        index,
                        "priority",
                        value as "REQUIRED" | "PREFERRED" | "OPTIONAL"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REQUIRED">Required</SelectItem>
                      <SelectItem value="PREFERRED">Preferred</SelectItem>
                      <SelectItem value="OPTIONAL">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCompetency(index)}
                >
                  <RiDeleteBinLine className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}

            {state.errors?.competencies && (
              <p className="text-sm text-red-600">
                {state.errors.competencies[0]}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setCompetencies([]);
              }}
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
                "Create Role"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
