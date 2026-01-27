"use client";

/**
 * Phase Management Dialog
 * Allows admin to link assessments, trainings, edit phase details
 */

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { linkAssessment, linkTraining, updatePhaseDetails, removeMentorFromPhase } from "@/actions/journeys";
import { 
  Link as LinkIcon, 
  FileText, 
  GraduationCap, 
  Calendar,
  User,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Phase {
  id: string;
  phaseNumber: number;
  title: string;
  description?: string | null;
  status: string;
  phaseType: string;
  durationDays: number;
  startedAt?: Date | null;
  dueDate?: Date | null;
  assessmentId?: string | null;
  trainingAssignmentId?: string | null;
  mentor?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
}

interface Assessment {
  id: string;
  title: string;
  status: string;
}

interface TrainingAssignment {
  id: string;
  training: {
    title: string;
    description?: string | null;
  };
  status: string;
}

interface PhaseManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: Phase;
  userId: string;
  availableAssessments?: Assessment[];
  availableTrainings?: TrainingAssignment[];
}

export function PhaseManagementDialog({
  open,
  onOpenChange,
  phase,
  userId,
  availableAssessments = [],
  availableTrainings = [],
}: PhaseManagementDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [selectedTraining, setSelectedTraining] = useState<string>("");
  
  // Editable phase fields
  const [title, setTitle] = useState(phase.title);
  const [description, setDescription] = useState(phase.description || "");
  const [durationDays, setDurationDays] = useState(phase.durationDays);
  
  // Reset state when phase changes
  useState(() => {
    setTitle(phase.title);
    setDescription(phase.description || "");
    setDurationDays(phase.durationDays);
  });

  const handleLinkAssessment = () => {
    if (!selectedAssessment) {
      toast.error("Please select an assessment");
      return;
    }

    startTransition(async () => {
      const result = await linkAssessment(phase.id, selectedAssessment);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to link assessment");
      }
    });
  };

  const handleLinkTraining = () => {
    if (!selectedTraining) {
      toast.error("Please select a training");
      return;
    }

    startTransition(async () => {
      const result = await linkTraining(phase.id, selectedTraining);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to link training");
      }
    });
  };

  const handleSavePhaseDetails = () => {
    startTransition(async () => {
      const result = await updatePhaseDetails(phase.id, {
        title,
        description,
        durationDays,
      });
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update phase");
      }
    });
  };

  const handleRemoveMentor = () => {
    if (!confirm("Are you sure you want to remove the assigned mentor?")) return;

    startTransition(async () => {
      const result = await removeMentorFromPhase(phase.id);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to remove mentor");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Manage Phase: {phase.title}</DialogTitle>
          <DialogDescription>
            Phase {phase.phaseNumber} • {phase.phaseType.replace(/_/g, " ")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link Content</TabsTrigger>
            <TabsTrigger value="details">Phase Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Link Assessments/Trainings */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" />
                  Link Assessment
                </Label>
                {phase.assessmentId ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Assessment already linked to this phase
                    </span>
                  </div>
                ) : (
                  <>
                    <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an assessment to link" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-50">
                          {availableAssessments.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                              No assessments available
                            </div>
                          ) : (
                            availableAssessments.map((assessment) => (
                              <SelectItem key={assessment.id} value={assessment.id}>
                                <div>
                                  <p className="font-medium">{assessment.title}</p>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {assessment.status}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleLinkAssessment} 
                      disabled={isPending || !selectedAssessment}
                      className="w-full mt-2"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link Assessment to Phase
                    </Button>
                  </>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                  <GraduationCap className="h-4 w-4" />
                  Link Training
                </Label>
                {phase.trainingAssignmentId ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Training already linked to this phase
                    </span>
                  </div>
                ) : (
                  <>
                    <Select value={selectedTraining} onValueChange={setSelectedTraining}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a training to link" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-50">
                          {availableTrainings.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                              No training assignments available
                            </div>
                          ) : (
                            availableTrainings.map((training) => (
                              <SelectItem key={training.id} value={training.id}>
                                <div>
                                  <p className="font-medium">{training.training.title}</p>
                                  {training.training.description && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {training.training.description}
                                    </p>
                                  )}
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {training.status}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleLinkTraining} 
                      disabled={isPending || !selectedTraining}
                      className="w-full mt-2"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link Training to Phase
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Phase Details */}
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Phase Title</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter phase title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter phase description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phase Type</Label>
                  <Input value={phase.phaseType.replace(/_/g, " ")} disabled />
                </div>
                <div>
                  <Label>Duration (days)</Label>
                  <Input 
                    type="number" 
                    value={durationDays} 
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                    min={1}
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-2">
                  <Badge variant="outline">{phase.status}</Badge>
                </div>
              </div>
              {phase.mentor && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Assigned Mentor
                  </Label>
                  <div className="p-3 border rounded-md flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                         {phase.mentor.avatar && (
                             <img src={phase.mentor.avatar} alt={phase.mentor.name} className="h-8 w-8 rounded-full object-cover" />
                        )} 
                        <span className="font-medium">{phase.mentor.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleRemoveMentor}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Remove Mentor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <Button 
                onClick={handleSavePhaseDetails} 
                disabled={isPending}
                className="w-full"
              >
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-4">
              {phase.startedAt && (
                <div className="flex items-center gap-3 p-3 border rounded-md">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Started</p>
                    <p className="text-xs text-gray-500">
                      {new Date(phase.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {phase.dueDate && (
                <div className="flex items-center gap-3 p-3 border rounded-md">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-xs text-gray-500">
                      {new Date(phase.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Duration:</strong> {phase.durationDays} days
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Phase Number:</strong> {phase.phaseNumber}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
