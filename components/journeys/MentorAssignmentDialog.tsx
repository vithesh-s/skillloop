"use client";

/**
 * Mentor Assignment Dialog
 * Dialog for assigning mentors to journey phases with notifications
 */

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { assignMentorToPhase } from "@/actions/journeys";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Phase {
  id: string;
  phaseNumber: number;
  title: string;
  status: string;
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  designation?: string | null;
  department?: string | null;
}

interface MentorAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phases: Phase[];
  availableMentors: Mentor[];
  employeeName: string;
  onSuccess?: () => void;
}

export function MentorAssignmentDialog({
  open,
  onOpenChange,
  phases,
  availableMentors,
  employeeName,
  onSuccess,
}: MentorAssignmentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("");
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [sendEmailToMentor, setSendEmailToMentor] = useState(true);
  const [sendEmailToEmployee, setSendEmailToEmployee] = useState(true);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId);
  const selectedMentor = availableMentors.find((m) => m.id === selectedMentorId);

  // Default notification message
  const defaultMessage = selectedMentor && selectedPhase
    ? `Hi ${selectedMentor.name},\n\nYou've been assigned as mentor for ${employeeName}'s ${selectedPhase.title} phase.\n\nPlease reach out to them to discuss next steps and provide guidance.\n\nBest regards`
    : "";

  const handleAssign = () => {
    if (!selectedPhaseId || !selectedMentorId) {
      toast.error("Please select both a phase and a mentor");
      return;
    }

    startTransition(async () => {
      const result = await assignMentorToPhase(
        selectedPhaseId,
        selectedMentorId,
        sendEmailToMentor
      );

      if (result.success) {
        toast.success(result.message || "Mentor assigned successfully");
        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setSelectedPhaseId("");
        setSelectedMentorId("");
        setNotificationMessage("");
      } else {
        toast.error(result.error || "Failed to assign mentor");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Mentor to Phase</DialogTitle>
          <DialogDescription>
            Assign a mentor to guide {employeeName} through a specific journey phase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Phase Selection */}
          <div className="space-y-2">
            <Label htmlFor="phase-select">Select Phase</Label>
            <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
              <SelectTrigger id="phase-select">
                <SelectValue placeholder="Choose a phase..." />
              </SelectTrigger>
              <SelectContent>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    Phase {phase.phaseNumber}: {phase.title}
                    {phase.status === "IN_PROGRESS" && " (In Progress)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mentor Selection */}
          <div className="space-y-2">
            <Label htmlFor="mentor-select">Select Mentor</Label>
            <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
              <SelectTrigger id="mentor-select">
                <SelectValue placeholder="Choose a mentor..." />
              </SelectTrigger>
              <SelectContent>
                {availableMentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    {mentor.name} - {mentor.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Available Mentors List */}
          <div className="space-y-2">
            <Label>Available Mentors</Label>
            <ScrollArea className="h-48 rounded-lg border p-4">
              <div className="space-y-3">
                {availableMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className={`flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer hover:bg-accent ${
                      selectedMentorId === mentor.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedMentorId(mentor.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={mentor.avatar || undefined} />
                      <AvatarFallback>
                        {mentor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{mentor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {mentor.designation}
                        {mentor.department && ` • ${mentor.department}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedMentorId === mentor.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMentorId(mentor.id);
                      }}
                    >
                      {selectedMentorId === mentor.id ? "Selected" : "Select"}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Notification Message */}
          <div className="space-y-2">
            <Label htmlFor="notification-message">
              Notification Message (optional)
            </Label>
            <Textarea
              id="notification-message"
              placeholder={defaultMessage}
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Notification Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-mentor-email"
                checked={sendEmailToMentor}
                onCheckedChange={(checked) =>
                  setSendEmailToMentor(checked as boolean)
                }
              />
              <Label
                htmlFor="send-mentor-email"
                className="text-sm font-normal cursor-pointer"
              >
                Send email notification to mentor
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-employee-email"
                checked={sendEmailToEmployee}
                onCheckedChange={(checked) =>
                  setSendEmailToEmployee(checked as boolean)
                }
              />
              <Label
                htmlFor="send-employee-email"
                className="text-sm font-normal cursor-pointer"
              >
                Send notification to employee
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isPending || !selectedPhaseId || !selectedMentorId}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Mentor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
