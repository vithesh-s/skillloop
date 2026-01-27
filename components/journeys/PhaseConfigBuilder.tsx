"use client";

/**
 * Phase Config Builder
 * Component for configuring training phases during user creation
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhaseType } from "@prisma/client";
import { Plus, X, Edit2, GripVertical } from "lucide-react";
import { PhaseConfig } from "@/lib/journey-constants";

interface PhaseConfigBuilderProps {
  defaultPhases: PhaseConfig[];
  value: PhaseConfig[];
  onChange: (phases: PhaseConfig[]) => void;
  availableMentors?: Array<{
    id: string;
    name: string;
  }>;
}

export function PhaseConfigBuilder({
  defaultPhases,
  value,
  onChange,
  availableMentors = [],
}: PhaseConfigBuilderProps) {
  const [phases, setPhases] = useState<PhaseConfig[]>(value);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New phase form state
  const [newPhase, setNewPhase] = useState<PhaseConfig>({
    phaseType: PhaseType.INDUCTION_TRAINING,
    title: "",
    description: "",
    durationDays: 3,
    mentorId: undefined,
  });

  useEffect(() => {
    setPhases(value);
  }, [value]);

  const handleAddPhase = () => {
    if (!newPhase.title) return;

    const updatedPhases = [...phases, newPhase];
    setPhases(updatedPhases);
    onChange(updatedPhases);

    // Reset form
    setNewPhase({
      phaseType: PhaseType.INDUCTION_TRAINING,
      title: "",
      description: "",
      durationDays: 3,
      mentorId: undefined,
    });
    setIsAddingNew(false);
  };

  const handleRemovePhase = (index: number) => {
    const updatedPhases = phases.filter((_, i) => i !== index);
    setPhases(updatedPhases);
    onChange(updatedPhases);
  };

  const handleUpdatePhase = (index: number, updates: Partial<PhaseConfig>) => {
    const updatedPhases = phases.map((phase, i) =>
      i === index ? { ...phase, ...updates } : phase
    );
    setPhases(updatedPhases);
    onChange(updatedPhases);
  };

  const handleResetToDefault = () => {
    setPhases(defaultPhases);
    onChange(defaultPhases);
    setIsAddingNew(false);
    setEditingPhaseIndex(null);
  };

  const totalDuration = phases.reduce((sum, phase) => sum + phase.durationDays, 0);

  return (
    <div className="space-y-4">
      {/* Phase List */}
      <div className="space-y-2">
        {phases.map((phase, index) => (
          <Card key={index} className="p-4">
            {editingPhaseIndex === index ? (
              // Edit Mode
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={phase.title}
                      onChange={(e) =>
                        handleUpdatePhase(index, { title: e.target.value })
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Duration (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={phase.durationDays}
                      onChange={(e) =>
                        handleUpdatePhase(index, {
                          durationDays: parseInt(e.target.value),
                        })
                      }
                      className="h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={phase.description || ""}
                    onChange={(e) =>
                      handleUpdatePhase(index, { description: e.target.value })
                    }
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPhaseIndex(null)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{index + 1}.</span>
                    <span className="font-medium text-sm">{phase.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {phase.durationDays} days
                    </Badge>
                  </div>
                  {phase.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {phase.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingPhaseIndex(index)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePhase(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add New Phase Form */}
      {isAddingNew && (
        <Card className="p-4 border-dashed">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Add Custom Phase</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  value={newPhase.title}
                  onChange={(e) =>
                    setNewPhase({ ...newPhase, title: e.target.value })
                  }
                  placeholder="e.g., Advanced Training"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newPhase.durationDays}
                  onChange={(e) =>
                    setNewPhase({
                      ...newPhase,
                      durationDays: parseInt(e.target.value) || 3,
                    })
                  }
                  className="h-8"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                value={newPhase.description || ""}
                onChange={(e) =>
                  setNewPhase({ ...newPhase, description: e.target.value })
                }
                placeholder="Describe the phase objectives..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>
            {availableMentors.length > 0 && (
              <div>
                <Label className="text-xs">Assign Mentor (optional)</Label>
                <Select
                  value={newPhase.mentorId}
                  onValueChange={(value) =>
                    setNewPhase({ ...newPhase, mentorId: value })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select a mentor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMentors.map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        {mentor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewPhase({
                    phaseType: PhaseType.INDUCTION_TRAINING,
                    title: "",
                    description: "",
                    durationDays: 3,
                    mentorId: undefined,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddPhase}
                disabled={!newPhase.title}
              >
                Add Phase
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Total Duration: <span className="font-semibold">{totalDuration} days</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetToDefault}
          >
            Reset to Default
          </Button>
          {!isAddingNew && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Custom Phase
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
