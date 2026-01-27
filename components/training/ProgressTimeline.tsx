'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { BarChart3, List, ChevronDown, Clock, MessageSquare, Calendar as CalendarIcon } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

interface ProgressUpdate {
    id: string
    weekNumber: number
    completionPercentage: number
    topicsCovered?: string | null
    timeSpent?: number | null
    challenges?: string | null
    nextPlan?: string | null
    mentorComments?: string | null
    createdAt: Date
}

interface ProgressTimelineProps {
    progressUpdates: ProgressUpdate[]
    assignmentId: string
}

export function ProgressTimeline({ progressUpdates, assignmentId }: ProgressTimelineProps) {
    const [view, setView] = useState<'chart' | 'list'>('chart')

    // Prepare data for chart
    const chartData = progressUpdates.map(update => ({
        week: `Week ${update.weekNumber}`,
        weekNumber: update.weekNumber,
        completion: update.completionPercentage,
        timeSpent: update.timeSpent || 0,
        date: format(new Date(update.createdAt), 'MMM d')
    }))

    // Calculate average for reference line
    const avgCompletion = chartData.length > 0
        ? chartData.reduce((sum: number, d: { completion: number }) => sum + d.completion, 0) / chartData.length
        : 0

    // Custom tooltip for chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
                    <p className="font-semibold">{data.week}</p>
                    <p className="text-sm text-muted-foreground">{data.date}</p>
                    <Separator className="my-2" />
                    <div className="space-y-1">
                        <p className="text-sm">
                            <span className="font-medium text-emerald-600">Completion:</span>{' '}
                            <span className="font-semibold">{data.completion}%</span>
                        </p>
                        <p className="text-sm">
                            <span className="font-medium text-blue-600">Time:</span>{' '}
                            <span className="font-semibold">{data.timeSpent}h</span>
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Progress Timeline</CardTitle>
                        <CardDescription>
                            Track your weekly progress and time investment
                        </CardDescription>
                    </div>
                    <Tabs value={view} onValueChange={(v) => setView(v as 'chart' | 'list')}>
                        <TabsList>
                            <TabsTrigger value="chart" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Chart
                            </TabsTrigger>
                            <TabsTrigger value="list" className="gap-2">
                                <List className="h-4 w-4" />
                                List
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                {progressUpdates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No progress updates yet</p>
                        <p className="text-sm text-muted-foreground">
                            Submit your first weekly update to start tracking progress
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chart View */}
                        {view === 'chart' && (
                            <div className="space-y-4">
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart
                                        data={chartData}
                                        margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis 
                                            dataKey="week" 
                                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                        />
                                        <YAxis 
                                            yAxisId="left"
                                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                            label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }}
                                        />
                                        <YAxis 
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                            label={{ value: 'Hours', angle: 90, position: 'insideRight' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <ReferenceLine 
                                            yAxisId="left"
                                            y={avgCompletion} 
                                            stroke="hsl(var(--primary))" 
                                            strokeDasharray="5 5"
                                            label={{ value: 'Avg', fill: 'hsl(var(--primary))' }}
                                        />
                                        <Bar 
                                            yAxisId="right"
                                            dataKey="timeSpent" 
                                            fill="#3b82f6"
                                            name="Time Spent (hrs)"
                                            radius={[8, 8, 0, 0]}
                                        />
                                        <Line 
                                            yAxisId="left"
                                            type="monotone" 
                                            dataKey="completion" 
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            name="Completion %"
                                            dot={{ fill: '#10b981', r: 6 }}
                                            activeDot={{ r: 8 }}
                                            isAnimationActive={true}
                                            animationDuration={1000}
                                            animationEasing="ease-in-out"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                                        <span>Completion Progress</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                                        <span>Time Investment</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* List View */}
                        {view === 'list' && (
                            <div className="space-y-4">
                                {progressUpdates.map((update, index) => {
                                    const isOverdue = index === progressUpdates.length - 1 && 
                                        (new Date().getTime() - new Date(update.createdAt).getTime()) / (1000 * 60 * 60 * 24) > 7

                                    return (
                                        <Collapsible key={update.id} defaultOpen={index === progressUpdates.length - 1}>
                                            <Card className={isOverdue ? 'border-red-500 border-2' : ''}>
                                                <CollapsibleTrigger asChild>
                                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="font-semibold">
                                                                        Week {update.weekNumber}
                                                                    </Badge>
                                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                        <CalendarIcon className="h-3 w-3" />
                                                                        {format(new Date(update.createdAt), 'MMM d, yyyy')}
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ({formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })})
                                                                    </span>
                                                                    {isOverdue && (
                                                                        <Badge variant="destructive" className="text-xs">
                                                                            Overdue
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex-1">
                                                                        <Progress value={update.completionPercentage} className="h-2" />
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {update.completionPercentage}% complete
                                                                        </p>
                                                                    </div>
                                                                    {update.timeSpent && (
                                                                        <div className="flex items-center gap-1 text-sm">
                                                                            <Clock className="h-4 w-4 text-blue-600" />
                                                                            <span className="font-semibold">{update.timeSpent}h</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="sm">
                                                                <ChevronDown className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <CardContent className="pt-0 space-y-4">
                                                        {update.topicsCovered && (
                                                            <div>
                                                                <p className="text-sm font-medium mb-1">Topics Covered</p>
                                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                                    {update.topicsCovered}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {update.challenges && (
                                                            <div>
                                                                <p className="text-sm font-medium mb-1">Challenges Faced</p>
                                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                                    {update.challenges}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {update.nextPlan && (
                                                            <div>
                                                                <p className="text-sm font-medium mb-1">Next Week's Plan</p>
                                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                                    {update.nextPlan}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {update.mentorComments && (
                                                            <div className="mt-4 pt-4 border-t bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                                                                    <p className="text-sm font-semibold text-emerald-600">
                                                                        Mentor Feedback
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm whitespace-pre-wrap">
                                                                    {update.mentorComments}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </CollapsibleContent>
                                            </Card>
                                        </Collapsible>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
