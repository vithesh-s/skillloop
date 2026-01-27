"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { JourneyTimeline } from "@/components/journeys/JourneyTimeline";
import { ActivityLog } from "@/components/journeys/ActivityLog";
import { MentorAssignmentDialog } from "@/components/journeys/MentorAssignmentDialog";
import {
  Briefcase,
  MapPin,
  Pause,
  Play,
  Mail,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { EmployeeType } from "@prisma/client";

interface JourneyContentClientProps {
  journey: any;
  progress: any;
  availableMentors: any[];
  availableAssessments: any[];
  availableTrainings: any[];
  userId: string;
}

export function JourneyContentClient({
  journey,
  progress,
  availableMentors,
  availableAssessments,
  availableTrainings,
  userId,
}: JourneyContentClientProps) {
  const [mentorDialogOpen, setMentorDialogOpen] = useState(false);
  const isNewEmployee = journey.employeeType === EmployeeType.NEW_EMPLOYEE;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="overflow-hidden">
        <div className="bg-card border-b p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
              <AvatarImage src={journey.user.avatar || undefined} />
              <AvatarFallback className="text-2xl">
                {journey.user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{journey.user.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {journey.user.designation && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {journey.user.designation}
                  </div>
                )}
                {journey.user.department && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {journey.user.department}
                  </div>
                )}
                {journey.user.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {journey.user.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isNewEmployee ? (
                  <Badge variant="secondary">
                    🆕 New Employee Journey
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    🔄 Existing Employee - Cycle {journey.cycleNumber}
                  </Badge>
                )}  
              </div>
              {isNewEmployee && progress.daysElapsed !== undefined && (
                <p className="text-sm text-muted-foreground">
                  Day {progress.daysElapsed} of {progress.daysElapsed + (progress.daysRemaining || 0)}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Progress</p>
              <div className="flex items-center gap-3">
                <Progress
                  value={progress.progressPercentage}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-foreground">
                  {progress.progressPercentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedPhases} of {progress.totalPhases} phases completed
              </p>
            </div>

            <div>
              {journey.startedAt && (
                <p className="text-sm text-muted-foreground">
                  Started: {format(journey.startedAt, "MMM d, yyyy")}
                </p>
              )}
              {isNewEmployee && progress.expectedCompletionDate && (
                <p className="text-sm text-muted-foreground">
                  Expected End:{" "}
                  {format(progress.expectedCompletionDate, "MMM d, yyyy")}
                </p>
              )}
              {progress.daysRemaining !== undefined && progress.daysRemaining > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {progress.daysRemaining} days remaining
                </p>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={journey.status === "IN_PROGRESS" ? "default" : "secondary"}>
                {journey.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setMentorDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Mentor
              </Button>
              {journey.status === "IN_PROGRESS" ? (
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Journey
                </Button>
              ) : journey.status === "PAUSED" ? (
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Resume Journey
                </Button>
              ) : null}
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Timeline + Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journey Timeline (60%) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Journey Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <JourneyTimeline
                phases={journey.phases}
                currentPhaseNumber={progress.currentPhase}
                userId={userId}
                availableAssessments={availableAssessments}
                availableTrainings={availableTrainings}
              />
            </CardContent>
          </Card>
        </div>

        {/* Activity Log (40%) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityLog
                activities={journey.activities}
                maxHeight="700px"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mentor Assignment Dialog */}
      <MentorAssignmentDialog
        open={mentorDialogOpen}
        onOpenChange={setMentorDialogOpen}
        phases={journey.phases}
        availableMentors={availableMentors}
        employeeName={journey.user.name}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
