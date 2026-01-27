import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMentorPhases } from "@/actions/journeys";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Mail, MapPin, Briefcase, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function MentorshipPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const result = await getMentorPhases(session.user.id);
  const phases = result.success ? result.phases : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentorship Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your mentees and track their journey progress.
          </p>
        </div>
      </div>

      <Separator />

      {phases && phases.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No Mentees Assigned</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              You haven't been assigned as a mentor to any journey phases yet. When you are assigned, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phases?.map((phase: any) => (
            <Card key={phase.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-background">
                      <AvatarImage src={phase.journey.user.avatar || undefined} />
                      <AvatarFallback>
                        {phase.journey.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{phase.journey.user.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                         {phase.journey.user.designation || "New Employee"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={phase.status === "IN_PROGRESS" ? "default" : "secondary"}>
                    {phase.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Phase:</span>
                    <span className="font-medium">Phase {phase.phaseNumber}: {phase.title}</span>
                  </div>
                  {phase.startedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span>{format(new Date(phase.startedAt), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {phase.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due:</span>
                      <span className={new Date(phase.dueDate) < new Date() ? "text-red-500 font-medium" : ""}>
                        {format(new Date(phase.dueDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  {phase.journey.user.email && (
                    <div className="flex items-center gap-1" title={phase.journey.user.email}>
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{phase.journey.user.email}</span>
                    </div>
                  )}
                  {phase.journey.user.department && (
                    <div className="flex items-center gap-1 ml-auto">
                      <MapPin className="h-3 w-3" />
                      <span>{phase.journey.user.department}</span>
                    </div>
                  )}
                </div>

                <Button asChild className="w-full mt-2" variant="outline">
                  <Link href={`/admin/users/${phase.journey.user.id}/journey`}>
                    View Journey details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
