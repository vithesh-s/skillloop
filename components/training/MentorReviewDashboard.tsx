'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Clock, Award, AlertCircle, Eye, TrendingUp, FileText } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Training {
    id: string
    status: string
    startDate: Date | null
    training: {
        topicName: string
        skill: {
            name: string
            category: {
                colorClass: string | null
            } | null
        } | null
    }
    user: {
        id: string
        name: string
        department: string | null
    }
    latestProgress?: {
        weekNumber: number
        completionPercentage: number
        createdAt: Date
    } | null
    daysSinceUpdate: number | null
    isOverdue: boolean
    pendingProofCount: number
}

interface MentorReviewDashboardProps {
    trainings: Training[]
}

export function MentorReviewDashboard({ trainings }: MentorReviewDashboardProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'date' | 'completion'>('date')

    // Filter and sort
    let filtered = trainings.filter(t => 
        t.user.name.toLowerCase().includes(search.toLowerCase()) ||
        t.training.topicName.toLowerCase().includes(search.toLowerCase())
    )

    if (statusFilter !== 'all') {
        if (statusFilter === 'overdue') {
            filtered = filtered.filter(t => t.isOverdue)
        } else if (statusFilter === 'pending-proof') {
            filtered = filtered.filter(t => t.pendingProofCount > 0)
        }
    }

    filtered.sort((a, b) => {
        if (sortBy === 'date') {
            const dateA = a.latestProgress?.createdAt || a.startDate || new Date(0)
            const dateB = b.latestProgress?.createdAt || b.startDate || new Date(0)
            return new Date(dateB).getTime() - new Date(dateA).getTime()
        } else {
            const completionA = a.latestProgress?.completionPercentage || 0
            const completionB = b.latestProgress?.completionPercentage || 0
            return completionB - completionA
        }
    })

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <Input
                    placeholder="Search by trainee or training..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="md:max-w-sm"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="md:w-50">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Trainings</SelectItem>
                        <SelectItem value="overdue">Overdue Updates</SelectItem>
                        <SelectItem value="pending-proof">Pending Proofs</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'completion')}>
                    <SelectTrigger className="md:w-45">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date">Recent Updates</SelectItem>
                        <SelectItem value="completion">Completion %</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Training Cards Grid */}
            {filtered.length === 0 ? (
                <Card className="p-12">
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                        <Clock className="h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No trainings found</p>
                        <p className="text-sm text-muted-foreground">
                            {search ? 'Try adjusting your search' : 'No trainings match the selected filters'}
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((training) => {
                        const initials = training.user.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)

                        const completion = training.latestProgress?.completionPercentage || 0
                        const weekNum = training.latestProgress?.weekNumber || 0

                        return (
                            <Card 
                                key={training.id}
                                className={`relative overflow-hidden hover:shadow-lg transition-shadow ${
                                    training.isOverdue ? 'border-red-500 border-2' : ''
                                }`}
                            >
                                {/* Overdue Indicator */}
                                {training.isOverdue && (
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                                        <AlertCircle className="h-3 w-3 inline mr-1" />
                                        Overdue
                                    </div>
                                )}

                                <CardHeader className="pb-3">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar>
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{training.user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {training.user.department || 'No department'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Training Info */}
                                    <CardTitle className="text-base line-clamp-2 min-h-12">
                                        {training.training.topicName}
                                    </CardTitle>
                                    
                                    {/* Skill Badge */}
                                    {training.training.skill && (
                                        <Badge 
                                            variant="secondary"
                                            className={training.training.skill.category?.colorClass || ''}
                                        >
                                            <Award className="h-3 w-3 mr-1" />
                                            {training.training.skill.name}
                                        </Badge>
                                    )}
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Progress Ring/Bar */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-semibold">{completion}%</span>
                                        </div>
                                        <Progress value={completion} className="h-2" />
                                        <p className="text-xs text-muted-foreground">
                                            Week {weekNum} {training.latestProgress && `· Last update ${format(new Date(training.latestProgress.createdAt), 'MMM d')}`}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                                {training.daysSinceUpdate !== null 
                                                    ? `${training.daysSinceUpdate}d ago`
                                                    : 'No updates'
                                                }
                                            </span>
                                        </div>
                                        {training.pendingProofCount > 0 && (
                                            <Badge variant="secondary" className="gap-1">
                                                <FileText className="h-3 w-3" />
                                                {training.pendingProofCount} proof{training.pendingProofCount > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/trainer/review-progress/${training.id}`} className="flex-1">
                                            <Button variant="default" size="sm" className="w-full">
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
