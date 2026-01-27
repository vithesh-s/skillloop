"use client";

/**
 * Activity Log Component
 * Displays a scrollable activity feed with timeline-style list and relative timestamps
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  User,
  GraduationCap,
  FileText,
  AlertCircle,
  Rocket,
  Link as LinkIcon,
  UserPlus,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  activityType: string;
  title: string;
  description?: string | null;
  createdAt: Date;
  phaseNumber?: number | null;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
}

interface ActivityLogProps {
  activities: Activity[];
  maxHeight?: string;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
}

const getActivityIcon = (activityType: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    JOURNEY_STARTED: <Rocket className="h-4 w-4" />,
    JOURNEY_COMPLETED: <CheckCircle2 className="h-4 w-4" />,
    JOURNEY_PAUSED: <PauseCircle className="h-4 w-4" />,
    JOURNEY_RESUMED: <PlayCircle className="h-4 w-4" />,
    PHASE_STARTED: <PlayCircle className="h-4 w-4" />,
    PHASE_AUTO_COMPLETED: <CheckCircle2 className="h-4 w-4" />,
    PHASE_ADDED: <FileText className="h-4 w-4" />,
    PHASE_DELETED: <Trash2 className="h-4 w-4" />,
    PHASE_OVERDUE: <AlertCircle className="h-4 w-4" />,
    MENTOR_ASSIGNED: <UserPlus className="h-4 w-4" />,
    ASSESSMENT_LINKED: <LinkIcon className="h-4 w-4" />,
    TRAINING_LINKED: <LinkIcon className="h-4 w-4" />,
  };

  return (
    iconMap[activityType] || <FileText className="h-4 w-4" />
  );
};

const getActivityColor = (activityType: string) => {
  const colorMap: Record<string, string> = {
    JOURNEY_STARTED: "text-blue-500 bg-blue-50 dark:bg-blue-950",
    JOURNEY_COMPLETED: "text-green-500 bg-green-50 dark:bg-green-950",
    JOURNEY_PAUSED: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
    JOURNEY_RESUMED: "text-blue-500 bg-blue-50 dark:bg-blue-950",
    PHASE_STARTED: "text-blue-500 bg-blue-50 dark:bg-blue-950",
    PHASE_AUTO_COMPLETED: "text-green-500 bg-green-50 dark:bg-green-950",
    PHASE_ADDED: "text-purple-500 bg-purple-50 dark:bg-purple-950",
    PHASE_DELETED: "text-red-500 bg-red-50 dark:bg-red-950",
    PHASE_OVERDUE: "text-red-500 bg-red-50 dark:bg-red-950",
    MENTOR_ASSIGNED: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950",
    ASSESSMENT_LINKED: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950",
    TRAINING_LINKED: "text-teal-500 bg-teal-50 dark:bg-teal-950",
  };

  return colorMap[activityType] || "text-gray-500 bg-gray-50 dark:bg-gray-950";
};

const getActivityEmoji = (activityType: string) => {
  const emojiMap: Record<string, string> = {
    JOURNEY_STARTED: "🚀",
    JOURNEY_COMPLETED: "🎉",
    JOURNEY_PAUSED: "⏸️",
    JOURNEY_RESUMED: "▶️",
    PHASE_STARTED: "🎯",
    PHASE_AUTO_COMPLETED: "✅",
    PHASE_ADDED: "➕",
    PHASE_DELETED: "🗑️",
    PHASE_OVERDUE: "⚠️",
    MENTOR_ASSIGNED: "👤",
    ASSESSMENT_LINKED: "📝",
    TRAINING_LINKED: "🎓",
  };

  return emojiMap[activityType] || "📌";
};

// Group activities by date
const groupActivitiesByDate = (activities: Activity[]) => {
  const groups: Record<string, Activity[]> = {};
  
  activities.forEach((activity) => {
    const date = format(activity.createdAt, "MMM d, yyyy");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
  });

  return groups;
};

export function ActivityLog({
  activities,
  maxHeight = "600px",
  showLoadMore = false,
  onLoadMore,
}: ActivityLogProps) {
  const groupedActivities = groupActivitiesByDate(activities);
  const dates = Object.keys(groupedActivities);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full rounded-lg border" style={{ height: maxHeight }}>
        <div className="p-4 space-y-6">
          {dates.map((date) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center gap-4 mb-4">
                <Separator className="flex-1" />
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {date}
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Activities for this date */}
              <div className="space-y-3">
                {groupedActivities[date].map((activity, index) => {
                  const isLast = index === groupedActivities[date].length - 1;

                  return (
                    <div key={activity.id} className="relative">
                      {/* Connecting line */}
                      {!isLast && (
                        <div className="absolute left-4.75 top-10 h-[calc(100%+0.75rem)] w-0.5 bg-border" />
                      )}

                      <div className="flex gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            getActivityColor(activity.activityType)
                          )}
                        >
                          {getActivityIcon(activity.activityType)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {getActivityEmoji(activity.activityType)}
                                </span>
                                <h4 className="text-sm font-semibold">
                                  {activity.title}
                                </h4>
                                {activity.phaseNumber && (
                                  <span className="text-xs text-muted-foreground">
                                    • Phase {activity.phaseNumber}
                                  </span>
                                )}
                              </div>
                              {activity.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {activity.description}
                                </p>
                              )}
                              {activity.user && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={activity.user.avatar || undefined} />
                                    <AvatarFallback className="text-[10px]">
                                      {activity.user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">
                                    {activity.user.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="shrink-0">
                              <span
                                className="text-xs text-muted-foreground"
                                title={format(activity.createdAt, "PPpp")}
                              >
                                {formatDistanceToNow(activity.createdAt, {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Load More Button */}
      {showLoadMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore}>
            Load More Activity
          </Button>
        </div>
      )}
    </div>
  );
}
