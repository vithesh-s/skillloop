"use client";

/**
 * Journey Timeline Component
 * Displays a vertical timeline with accordion phases, color-coded status indicators
 */

import { useState } from "react";
import { PhaseStatus } from "@/lib/journey-constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PhaseManagementDialog } from "@/components/journeys/PhaseManagementDialog";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  FileText,
  GraduationCap,
  Settings,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PhaseData {
  id: string;
  phaseNumber: number;
  title: string;
  description?: string | null;
  status: PhaseStatus;
  durationDays: number;
  phaseType: string;
  startedAt?: Date | null;
  completedAt?: Date | null;
  dueDate?: Date | null;
  mentor?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    designation?: string | null;
  } | null;
  assessmentId?: string | null;
  trainingAssignmentId?: string | null;
}

interface JourneyTimelineProps {
  phases: PhaseData[];
  currentPhaseNumber?: number;
  userId?: string;
  availableAssessments?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  availableTrainings?: Array<{
    id: string;
    training: {
      title: string;
      description?: string | null;
    };
    status: string;
  }>;
  onViewAssessment?: (assessmentId: string) => void;
  onViewTraining?: (trainingId: string) => void;
}

const getStatusIcon = (status: PhaseStatus, isActive: boolean) => {
  switch (status) {
    case PhaseStatus.COMPLETED:
      return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    case PhaseStatus.IN_PROGRESS:
      return (
        <div className={cn("relative", isActive && "animate-pulse")}>
          <Circle className="h-6 w-6 fill-blue-500 text-blue-500" />
          {isActive && (
            <div className="absolute inset-0 h-6 w-6 animate-ping">
              <Circle className="h-6 w-6 fill-blue-400 text-blue-400 opacity-75" />
            </div>
          )}
        </div>
      );
    case PhaseStatus.OVERDUE:
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    case PhaseStatus.NOT_STARTED:
    default:
      return <Circle className="h-6 w-6 text-gray-300" />;
  }
};

const getStatusBadge = (status: PhaseStatus) => {
  const variants: Record<PhaseStatus, { variant: "default" | "secondary" | "destructive" | "outline", text: string }> = {
    COMPLETED: { variant: "default", text: "Completed" },
    IN_PROGRESS: { variant: "secondary", text: "In Progress" },
    OVERDUE: { variant: "destructive", text: "Overdue" },
    NOT_STARTED: { variant: "outline", text: "Not Started" },
  };

  const config = variants[status];
  return (
    <Badge variant={config.variant} className="ml-2">
      {config.text}
    </Badge>
  );
};

const getStatusColor = (status: PhaseStatus) => {
  switch (status) {
    case PhaseStatus.COMPLETED:
      return "bg-green-500";
    case PhaseStatus.IN_PROGRESS:
      return "bg-blue-500";
    case PhaseStatus.OVERDUE:
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
};

export function JourneyTimeline({
  phases,
  currentPhaseNumber,
  userId,
  availableAssessments = [],
  availableTrainings = [],
  onViewAssessment,
  onViewTraining,
}: JourneyTimelineProps) {
  const [openPhases, setOpenPhases] = useState<string[]>(
    phases
      .filter((p) => p.status === PhaseStatus.IN_PROGRESS)
      .map((p) => `phase-${p.phaseNumber}`)
  );
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseData | null>(null);

  const sortedPhases = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);

  const handleManagePhase = (phase: PhaseData) => {
    setSelectedPhase(phase);
    setManageDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        value={openPhases}
        onValueChange={setOpenPhases}
        className="space-y-4"
      >
        {sortedPhases.map((phase, index) => {
          const isActive = phase.phaseNumber === currentPhaseNumber;
          const isCompleted = phase.status === PhaseStatus.COMPLETED;
          const isInProgress = phase.status === PhaseStatus.IN_PROGRESS;
          const isOverdue = phase.status === PhaseStatus.OVERDUE;
          const isLast = index === sortedPhases.length - 1;

          // Calculate progress percentage for in-progress phases
          let progressPercentage = 0;
          if (isInProgress && phase.startedAt && phase.dueDate) {
            const total =
              new Date(phase.dueDate).getTime() -
              new Date(phase.startedAt).getTime();
            const elapsed = Date.now() - new Date(phase.startedAt).getTime();
            // Round to 2 decimal places to fix hydration mismatch
            progressPercentage = Math.round(Math.min(100, Math.max(0, (elapsed / total) * 100)) * 100) / 100;
          } else if (isCompleted) {
            progressPercentage = 100;
          }

          return (
            <div key={phase.id} className="relative">
              {/* Vertical connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-2.75 top-12 h-[calc(100%+1rem)] w-0.5",
                    getStatusColor(phase.status)
                  )}
                />
              )}

              <AccordionItem
                value={`phase-${phase.phaseNumber}`}
                className="border-none"
              >
                <Card
                  className={cn(
                    "relative overflow-hidden transition-all",
                    isActive && "ring-2 ring-blue-500 ring-offset-2",
                    isOverdue && "ring-2 ring-red-500 ring-offset-2"
                  )}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex w-full items-center gap-4">
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {getStatusIcon(phase.status, isActive)}
                      </div>

                      {/* Phase Info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Phase {phase.phaseNumber}
                          </span>
                          {getStatusBadge(phase.status)}
                        </div>
                        <h3 className="mt-1 text-lg font-semibold">
                          {phase.title}
                        </h3>
                        {phase.completedAt && (
                          <p className="text-sm text-muted-foreground">
                            Completed on {format(phase.completedAt, "MMM d, yyyy")}
                          </p>
                        )}
                        {isInProgress && phase.dueDate && (
                          <p className="text-sm text-muted-foreground">
                            Due{" "}
                            {formatDistanceToNow(phase.dueDate, {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6">
                    <Separator className="mb-4" />

                    <div className="space-y-4">
                      {/* Description */}
                      {phase.description && (
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {phase.description}
                          </p>
                        </div>
                      )}

                      {/* Progress Bar for In Progress */}
                      {isInProgress && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      )}

                      {/* Timeline Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {phase.startedAt && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Started: {format(phase.startedAt, "MMM d, yyyy")}
                            </span>
                          </div>
                        )}
                        {phase.dueDate && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              Due: {format(phase.dueDate, "MMM d, yyyy")}
                              {isOverdue && " (Overdue)"}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Duration: {phase.durationDays} days</span>
                        </div>
                      </div>

                      {/* Mentor Info */}
                      {phase.mentor && (
                        <div>
                          <Separator className="my-4" />
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={phase.mentor.avatar || undefined} />
                              <AvatarFallback>
                                {phase.mentor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Mentor</span>
                              </div>
                              <p className="text-sm font-semibold">
                                {phase.mentor.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {phase.mentor.designation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Linked Entities */}
                      {(phase.assessmentId || phase.trainingAssignmentId) && (
                        <div>
                          <Separator className="my-4" />
                          <div className="space-y-2">
                            {phase.assessmentId && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Linked Assessment
                                  </span>
                                </div>
                                {onViewAssessment && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onViewAssessment(phase.assessmentId!)}
                                  >
                                    View Assessment
                                  </Button>
                                )}
                              </div>
                            )}
                            {phase.trainingAssignmentId && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Linked Training
                                  </span>
                                </div>
                                {onViewTraining && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      onViewTraining(phase.trainingAssignmentId!)
                                    }
                                  >
                                    View Training
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Auto-advance note */}
                      {isInProgress &&
                        (phase.assessmentId || phase.trainingAssignmentId) && (
                          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            ⚡ This phase will automatically advance when the linked{" "}
                            {phase.assessmentId ? "assessment" : "training"} is
                            completed.
                          </div>
                        )}

                      {/* Manage Phase Button */}
                      {userId && (
                        <div className="mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManagePhase(phase)}
                            className="w-full"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Phase
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </div>
          );
        })}
      </Accordion>

      {/* Phase Management Dialog */}
      {selectedPhase && userId && (
        <PhaseManagementDialog
          open={manageDialogOpen}
          onOpenChange={setManageDialogOpen}
          phase={selectedPhase}
          userId={userId}
          availableAssessments={availableAssessments}
          availableTrainings={availableTrainings}
        />
      )}
    </div>
  );
}
