'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Calendar, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { format, addWeeks, differenceInDays } from 'date-fns'

interface ProgressStats {
    totalWeeks: number
    completedWeeks: number
    averageCompletion: number
    totalTimeSpent: number
    lastUpdateDate: Date | null
    approvedProofs: number
    pendingProofs: number
}

interface ProgressStatsProps {
    stats: ProgressStats
}

export function ProgressStats({ stats }: ProgressStatsProps) {
    // Calculate projected completion (rough estimate)
    const weeksRemaining = stats.averageCompletion > 0 
        ? Math.ceil((100 - stats.averageCompletion) / (stats.averageCompletion / (stats.totalWeeks || 1)))
        : 0

    const projectedDate = stats.lastUpdateDate && weeksRemaining > 0
        ? addWeeks(new Date(stats.lastUpdateDate), weeksRemaining)
        : null

    // Check if overdue (no update in 7 days)
    const isOverdue = stats.lastUpdateDate 
        ? differenceInDays(new Date(), new Date(stats.lastUpdateDate)) > 7
        : false

    return (
        <Card className="border-2">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Average Completion */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm font-medium">Overall Progress</span>
                            </div>
                            <Badge variant={stats.averageCompletion >= 80 ? 'default' : 'secondary'}>
                                {stats.averageCompletion}%
                            </Badge>
                        </div>
                        <Progress value={stats.averageCompletion} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {stats.completedWeeks} of {stats.totalWeeks} weeks completed
                        </p>
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block" />

                    {/* Time Spent */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Time Invested</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">{stats.totalTimeSpent}</span>
                            <span className="text-sm text-muted-foreground">hours</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg: {stats.totalWeeks > 0 ? (stats.totalTimeSpent / stats.totalWeeks).toFixed(1) : 0} hrs/week
                        </p>
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block" />

                    {/* Last Update */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium">Last Update</span>
                        </div>
                        {stats.lastUpdateDate ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">
                                        {format(new Date(stats.lastUpdateDate), 'MMM d, yyyy')}
                                    </span>
                                    {isOverdue && (
                                        <Badge variant="destructive" className="text-xs">
                                            Overdue
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {differenceInDays(new Date(), new Date(stats.lastUpdateDate))} days ago
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">No updates yet</p>
                                <p className="text-xs text-muted-foreground">Start tracking your progress</p>
                            </>
                        )}
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block" />

                    {/* Projected Completion */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Projected End</span>
                        </div>
                        {projectedDate ? (
                            <>
                                <div className="text-sm font-semibold">
                                    {format(projectedDate, 'MMM d, yyyy')}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    ~{weeksRemaining} weeks remaining
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">Calculating...</p>
                                <p className="text-xs text-muted-foreground">Need more data</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Proof Status */}
                {(stats.approvedProofs > 0 || stats.pendingProofs > 0) && (
                    <>
                        <Separator className="my-4" />
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">Proof Status:</span>
                            {stats.approvedProofs > 0 && (
                                <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {stats.approvedProofs} Approved
                                </Badge>
                            )}
                            {stats.pendingProofs > 0 && (
                                <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {stats.pendingProofs} Pending Review
                                </Badge>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
