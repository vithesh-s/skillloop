"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateRole, type RoleFormState, getAllSkills, getRoleById } from "@/actions/roles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { RiLoader4Line, RiDeleteBinLine, RiAddLine } from "@remixicon/react";
import { toast } from "sonner";

interface EditRoleDialogProps {
  roleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Competency {
  skillId: string;
  skillName?: string;
  requiredLevel: string;
  priority: "REQUIRED" | "PREFERRED" | "OPTIONAL";
}

interface RoleData {
  id: string;
  name: string;
  department: string;
  description: string | null;
  level: string;
  competencies: Array<{
    id: string;
    skillId: string;
    requiredLevel: string;
    priority: string;
    skill: {
      id: string;
      name: string;
    };
  }>;
}

const initialState: RoleFormState = {};

export function EditRoleDialog({ roleId, open, onOpenChange }: EditRoleDialogProps) {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Wrapper for the update action to preserve correct typing
  const updateRoleAction = async (state: RoleFormState, payload: FormData) => {
    return updateRole(roleId, state, payload);
  };
  
  const [state, formAction, isPending] = useActionState(
    updateRoleAction,
    initialState
  );
  const router = useRouter();

  // Load role data and skills
  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        getRoleById(roleId),
        getAllSkills()
      ]).then(([role, skillsList]) => {
        if (role) {
          setRoleData(role as any);
          setSkills(skillsList);
          
          // Convert existing competencies to local state
          const existingCompetencies = role.competencies.map(comp => ({
            skillId: comp.skillId,
            skillName: comp.skill.name,
            requiredLevel: comp.requiredLevel,
            priority: comp.priority as "REQUIRED" | "PREFERRED" | "OPTIONAL"
          }));
          setCompetencies(existingCompetencies);
        }
        setLoading(false);
      }).catch(() => {
        toast.error("Failed to load role data");
        setLoading(false);
      });
    }
  }, [open, roleId]);

  // Handle success
  useEffect(() => {
    if (state.success && open) {
      toast.success(state.message);
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, state.message, open, router, onOpenChange]);

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

  if (loading || !roleData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-175">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <RiLoader4Line className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>
            
            <div>
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={roleData.name}
                placeholder="e.g., Senior Software Engineer"
                required
              />
              {state.errors?.name && (
                <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                name="department"
                defaultValue={roleData.department}
                placeholder="e.g., Software Development"
                required
              />
              {state.errors?.department && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.department[0]}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="level">Level *</Label>
              <Select name="level" defaultValue={roleData.level} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRY">Entry Level</SelectItem>
                  <SelectItem value="MID">Mid Level</SelectItem>
                  <SelectItem value="SENIOR">Senior Level</SelectItem>
                  <SelectItem value="LEAD">Lead Level</SelectItem>
                </SelectContent>
              </Select>
              {state.errors?.level && (
                <p className="mt-1 text-sm text-red-600">{state.errors.level[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={roleData.description || ""}
                placeholder="Describe the role..."
                rows={3}
              />
              {state.errors?.description && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.description[0]}
                </p>
              )}
            </div>
          </div>

          {/* Competencies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Required Competencies *</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompetency}
              >
                <RiAddLine className="mr-2 h-4 w-4" />
                Add Competency
              </Button>
            </div>

            {competencies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No competencies added yet. Click "Add Competency" to start.
              </p>
            )}

            <div className="space-y-3">
              {competencies.map((comp, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 rounded-lg border p-3"
                >
                  <div className="col-span-5">
                    <Select
                      value={comp.skillId}
                      onValueChange={(value) => {
                        const selectedSkill = skills.find(s => s.id === value);
                        updateCompetency(index, "skillId", value);
                        if (selectedSkill) {
                          updateCompetency(index, "skillName", selectedSkill.name);
                        }
                      }}
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

                  <div className="col-span-3">
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

                  <div className="col-span-3">
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

                  <div className="col-span-1 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompetency(index)}
                    >
                      <RiDeleteBinLine className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
