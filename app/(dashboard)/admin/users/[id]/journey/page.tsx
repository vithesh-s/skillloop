import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEmployeeJourney } from "@/actions/journeys";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { JourneyContentClient } from "@/app/(dashboard)/admin/users/[id]/journey/journey-content-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function JourneyContentServer({ userId }: { userId: string }) {
  const result = await getEmployeeJourney(userId);

  if (!result.success || !result.journey) {
    notFound();
  }

  const journey = result.journey;
  const progress = journey.progress;

  // Get available mentors for assignment dialog
  // Get available mentors (any user except the learner themselves)
  const availableMentors = await prisma.user.findMany({
    where: {
      id: {
        not: userId,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      designation: true,
      department: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`[JourneyPage] Found ${availableMentors.length} available mentors`);


  // Get IDs of assessments and trainings already linked to journey phases
  const linkedAssessmentIds = journey.phases
    .filter((p: any) => p.assessmentId)
    .map((p: any) => p.assessmentId!);
  const linkedTrainingIds = journey.phases
    .filter((p: any) => p.trainingAssignmentId)
    .map((p: any) => p.trainingAssignmentId!);

  // Get ALL available assessments (not linked to any journey phase)
  // We want to show all published assessments even if not assigned to the user yet
  const availableAssessments = await prisma.assessment.findMany({
    where: {
      status: "PUBLISHED",
      id: {
        notIn: linkedAssessmentIds,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
    orderBy: {
      title: 'asc',
    },
  }).then(assessments => 
    assessments.map(a => ({
      id: a.id,
      title: a.title,
      status: String(a.status),
    }))
  );

  // Get available trainings for the user (assigned but not linked to any journey phase)
  const availableTrainings = await prisma.trainingAssignment.findMany({
    where: {
      userId: userId,
      id: {
        notIn: linkedTrainingIds,
      },
    },
    select: {
      id: true,
      training: {
        select: {
          topicName: true,
          description: true,
        },
      },
      status: true,
    },
  }).then(assignments => 
    assignments.map(a => ({
      id: a.id,
      training: {
        title: a.training.topicName,
        description: a.training.description,
      },
      status: String(a.status),
    }))
  );

  return (
    <JourneyContentClient
      journey={journey}
      progress={progress}
      availableMentors={availableMentors}
      availableAssessments={availableAssessments}
      availableTrainings={availableTrainings}
      userId={userId}
    />
  );
}

function JourneyLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function JourneyPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<JourneyLoading />}>
        <JourneyContentServer userId={id} />
      </Suspense>
    </div>
  );
}
