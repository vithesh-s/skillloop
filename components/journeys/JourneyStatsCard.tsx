/**
 * Journey Stats Card
 * Dashboard widget showing journey statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { getJourneyStatistics } from "@/actions/journeys";

interface JourneyStats {
  totalActive: number;
  totalCompleted: number;
  overduePhases: number;
  newEmployeeJourneys: number;
  existingEmployeeJourneys: number;
  recentActivities: Array<{
    id: string;
    title: string;
    activityType: string;
    createdAt: Date;
    journey: {
      user: {
        name: string;
        avatar?: string | null;
      };
    };
  }>;
}

export async function JourneyStatsCard() {
  const result = await getJourneyStatistics();

  if (!result.success || !result.stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No journey data available</p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalActive,
    totalCompleted,
    overduePhases,
    newEmployeeJourneys,
    existingEmployeeJourneys,
    recentActivities,
  } = result.stats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Active Journeys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Journeys</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalActive}</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {newEmployeeJourneys} New
            </Badge>
            <Badge variant="outline" className="text-xs">
              {existingEmployeeJourneys} Existing
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Completed Journeys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Journeys
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCompleted}</div>
          <p className="text-xs text-muted-foreground mt-2">
            <TrendingUp className="inline h-3 w-3 mr-1" />
            All phases completed
          </p>
        </CardContent>
      </Card>

      {/* Overdue Phases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Phases</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{overduePhases}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {overduePhases > 0 ? "Requires attention" : "All on track"}
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Recent Activity
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentActivities.length}</div>
          <Link href="/admin/users?tab=journeys">
            <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-2">
              View all
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Activities List */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Recent Journey Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activities
                </p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={activity.journey.user.avatar || undefined}
                      />
                      <AvatarFallback>
                        {activity.journey.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {activity.journey.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(activity.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
