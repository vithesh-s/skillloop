'use client'

import { type TrainingRecommendation } from '@/types/skill-matrix'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  RiBookOpenLine, 
  RiComputerLine, 
  RiTeamLine, 
  RiCalendarLine,
  RiTimeLine,
  RiExternalLinkLine
} from '@remixicon/react'
import { TrainingResources } from './training-resources'

interface TrainingRecommendationsListProps {
  recommendations: TrainingRecommendation[]
}

const priorityColors = {
  CRITICAL: 'bg-destructive hover:bg-destructive/90',
  HIGH: 'bg-orange-500 hover:bg-orange-600',
  MEDIUM: 'bg-yellow-500 hover:bg-yellow-600',
  LOW: 'bg-blue-500 hover:bg-blue-600',
}

export function TrainingRecommendationsList({ recommendations }: TrainingRecommendationsListProps) {
  // Group by priority
  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    if (!acc[rec.priority]) {
      acc[rec.priority] = []
    }
    acc[rec.priority].push(rec)
    return acc
  }, {} as Record<string, TrainingRecommendation[]>)

  const priorityOrder: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

  return (
    <div className="space-y-6">
      {priorityOrder.map((priority) => {
        const recs = groupedRecommendations[priority]
        if (!recs || recs.length === 0) return null

        return (
          <div key={priority}>
            <div className="flex items-center gap-2 mb-4">
              <Badge className={priorityColors[priority]}>
                {priority} Priority
              </Badge>
              <span className="text-sm text-muted-foreground">
                {recs.length} {recs.length === 1 ? 'training' : 'trainings'}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {recs.map((rec) => (
                <Card key={rec.trainingId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{rec.trainingName}</CardTitle>
                        <CardDescription className="mt-1">
                          For skill: <span className="font-semibold">{rec.skillName}</span>
                        </CardDescription>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={rec.mode === 'ONLINE' ? 'border-blue-500 text-blue-500' : 'border-purple-500 text-purple-500'}
                      >
                        {rec.mode}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Duration */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RiTimeLine className="h-4 w-4" />
                        <span>{rec.estimatedDuration} hours</span>
                      </div>

                      {/* Next Available Date */}
                      {rec.nextAvailableDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <RiCalendarLine className="h-4 w-4" />
                          <span>
                            Next session: {new Date(rec.nextAvailableDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {/* Available Seats (for offline) */}
                      {rec.availableSeats && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <RiTeamLine className="h-4 w-4" />
                          <span>{rec.availableSeats} seats available</span>
                        </div>
                      )}

                      {/* Mentor Available */}
                      <div className="flex items-center gap-2 text-sm">
                        {rec.mentorAvailable ? (
                          <>
                            <RiBookOpenLine className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Mentor assigned</span>
                          </>
                        ) : (
                          <>
                            <RiBookOpenLine className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Self-paced</span>
                          </>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button className="w-full mt-4" variant="default">
                        Request Training
                      </Button>

                      {/* Learning Resources */}
                      {rec.resources && rec.resources.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <TrainingResources resources={rec.resources} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
