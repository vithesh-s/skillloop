'use client'

import { useEffect, useState } from 'react'
import { getTrainingFeedback } from '@/actions/feedback'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
} from 'recharts'
import { Star, MessageSquare, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

interface FeedbackSummaryCardProps {
    trainingId: string
    showFullReportButton?: boolean
}

export function FeedbackSummaryCard({ trainingId, showFullReportButton = true }: FeedbackSummaryCardProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        loadFeedback()
    }, [trainingId])

    const loadFeedback = async () => {
        setLoading(true)
        try {
            const result = await getTrainingFeedback(trainingId)
            setData(result)
        } catch (error) {
            console.error('Failed to load feedback:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Training Feedback
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Loading feedback...
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data || data.aggregates.totalResponses === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Training Feedback
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        No feedback submitted yet
                    </div>
                </CardContent>
            </Card>
        )
    }

    const { aggregates, feedbacks } = data

    const radarData = [
        { metric: 'Trainer', score: aggregates.avgTrainerRating },
        { metric: 'Content', score: aggregates.avgContentRating },
        { metric: 'Materials', score: aggregates.avgLogisticsRating },
        { metric: 'Overall', score: aggregates.avgOverallRating },
    ]

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-600'
        if (rating >= 3) return 'text-yellow-600'
        return 'text-red-600'
    }

    const recentComments: Array<{ name: string; comment: string; rating: number }> = feedbacks.slice(0, 3).map((fb: any) => ({
        name: fb.submitter.name,
        comment: fb.detailedFeedback?.likeMost || 'No comment provided',
        rating: fb.overallRating || 0,
    }))

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Training Feedback
                        </CardTitle>
                        <CardDescription>
                            Learner satisfaction and feedback summary
                        </CardDescription>
                    </div>
                    {showFullReportButton && (
                        <Link href="/admin/reports/feedback">
                            <Button variant="outline" size="sm">
                                View Full Report
                            </Button>
                        </Link>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-2xl font-bold">{aggregates.totalResponses}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Responses</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Star className={`h-4 w-4 ${getRatingColor(aggregates.avgOverallRating)}`} />
                            <span className={`text-2xl font-bold ${getRatingColor(aggregates.avgOverallRating)}`}>
                                {aggregates.avgOverallRating}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Overall</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className={`h-4 w-4 ${getRatingColor(aggregates.avgTrainerRating)}`} />
                            <span className={`text-2xl font-bold ${getRatingColor(aggregates.avgTrainerRating)}`}>
                                {aggregates.avgTrainerRating}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Trainer</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <MessageSquare className={`h-4 w-4 ${getRatingColor(aggregates.avgContentRating)}`} />
                            <span className={`text-2xl font-bold ${getRatingColor(aggregates.avgContentRating)}`}>
                                {aggregates.avgContentRating}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Content</p>
                    </div>
                </div>

                <Separator />

                {/* Quality Distribution */}
                <div>
                    <h4 className="text-sm font-semibold mb-3">Quality Ratings</h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(aggregates.qualityDistribution).map(([quality, count]) => (
                            <Badge
                                key={quality}
                                variant="outline"
                                className={
                                    quality === 'Excellent'
                                        ? 'bg-green-50 text-green-700 border-green-300'
                                        : quality === 'Good'
                                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                                            : quality === 'Average'
                                                ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                                : 'bg-red-50 text-red-700 border-red-300'
                                }
                            >
                                {quality}: {String(count)}
                            </Badge>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Radar Chart */}
                <div>
                    <h4 className="text-sm font-semibold mb-3">Rating Breakdown</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" />
                            <PolarRadiusAxis angle={90} domain={[0, 5]} />
                            <Radar
                                name="Rating"
                                dataKey="score"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.6}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <Separator />

                {/* Recent Comments - Scrollable List */}
                <div>
                    <h4 className="text-sm font-semibold mb-3">Recent Comments</h4>
                    {recentComments.length > 0 ? (
                        <div className="space-y-3">
                            {recentComments.map((comment, index) => (
                                <Card key={index} className="border-none shadow-none bg-muted/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="font-medium text-sm">{comment.name}</p>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                <span className="text-xs font-medium">{comment.rating}/5</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground italic">
                                            "{comment.comment.substring(0, 150)}
                                            {comment.comment.length > 150 ? '...' : ''}"
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No comments available</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
