'use client'

import { useState, useEffect } from 'react'
import { getFeedbackSummary, exportFeedbackReport } from '@/actions/feedback'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ComposedChart,
    BarChart,
    PieChart,
    Pie,
    Cell,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { CalendarIcon, Download, TrendingUp, TrendingDown, Users, Award, MessageSquare, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function FeedbackReportPage() {
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<any>(null)
    const [filters, setFilters] = useState({
        dateFrom: undefined as Date | undefined,
        dateTo: undefined as Date | undefined,
        department: undefined as string | undefined,
        trainingMode: undefined as 'ONLINE' | 'OFFLINE' | undefined,
        ratingMin: 1,
        ratingMax: 5,
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getFeedbackSummary(filters)
            setSummary(data)
        } catch (error: any) {
            toast.error('Failed to load feedback data', {
                description: error.message || 'Please try again',
            })
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        loadData()
    }

    const handleExport = async () => {
        try {
            const result = await exportFeedbackReport(filters)
            if (result.success) {
                const blob = new Blob([result.csv], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = result.filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)

                toast.success('Report exported successfully', {
                    description: `Downloaded ${result.filename}`,
                })
            }
        } catch (error: any) {
            toast.error('Failed to export report', {
                description: error.message || 'Please try again',
            })
        }
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-600'
        if (rating >= 3) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getQualityColor = (quality: string) => {
        switch (quality) {
            case 'Excellent':
                return 'bg-green-100 text-green-800 border-green-300'
            case 'Good':
                return 'bg-blue-100 text-blue-800 border-blue-300'
            case 'Average':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300'
            case 'Below Average':
                return 'bg-red-100 text-red-800 border-red-300'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }

    const radarData = summary ? [
        { metric: 'Trainer', score: summary.summary.avgRatings.trainer },
        { metric: 'Content', score: summary.summary.avgRatings.content },
        { metric: 'Logistics', score: summary.summary.avgRatings.logistics },
        { metric: 'Overall', score: summary.summary.avgRatings.overall },
    ] : []

    const pieData = summary ? [
        { name: 'Excellent', value: summary.feedbacks.filter((f: any) => f.detailedFeedback?.qualityRating === 'Excellent').length, color: '#10b981' },
        { name: 'Good', value: summary.feedbacks.filter((f: any) => f.detailedFeedback?.qualityRating === 'Good').length, color: '#3b82f6' },
        { name: 'Average', value: summary.feedbacks.filter((f: any) => f.detailedFeedback?.qualityRating === 'Average').length, color: '#f59e0b' },
        { name: 'Below Average', value: summary.feedbacks.filter((f: any) => f.detailedFeedback?.qualityRating === 'Below Average').length, color: '#ef4444' },
    ] : []

    if (loading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading feedback data...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Training Feedback Analytics</h1>
                    <p className="text-muted-foreground">
                        Comprehensive analysis of training feedback and satisfaction scores
                    </p>
                </div>
                <Button onClick={handleExport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Filter Panel */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Customize your feedback report</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label>From Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateFrom}
                                        onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>To Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateTo ? format(filters.dateTo, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateTo}
                                        onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Training Mode */}
                        <div className="space-y-2">
                            <Label>Training Mode</Label>
                            <Select
                                value={filters.trainingMode || 'all'}
                                onValueChange={(value) => setFilters({ ...filters, trainingMode: value === 'all' ? undefined : value as 'ONLINE' | 'OFFLINE' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All modes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Modes</SelectItem>
                                    <SelectItem value="ONLINE">Online</SelectItem>
                                    <SelectItem value="OFFLINE">Offline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Rating Range */}
                        <div className="space-y-2 col-span-2">
                            <Label>Rating Range: {filters.ratingMin} - {filters.ratingMax}</Label>
                            <div className="pt-2">
                                <Slider
                                    min={1}
                                    max={5}
                                    step={1}
                                    value={[filters.ratingMin, filters.ratingMax]}
                                    onValueChange={([min, max]) => setFilters({ ...filters, ratingMin: min, ratingMax: max })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button onClick={applyFilters}>Apply Filters</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.summary.totalResponses || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Response Rate: {summary?.summary.responseRate || 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getRatingColor(summary?.summary.avgRatings.overall || 0)}`}>
                            {summary?.summary.avgRatings.overall || 0}/5
                        </div>
                        <div className="flex items-center text-xs">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            <span className="text-muted-foreground">Overall satisfaction</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary?.summary.npsScore >= 50 ? 'text-green-600' : summary?.summary.npsScore >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {summary?.summary.npsScore || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Net Promoter Score
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Trainer Rating</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getRatingColor(summary?.summary.avgRatings.trainer || 0)}`}>
                            {summary?.summary.avgRatings.trainer || 0}/5
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Trainer effectiveness
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Visualizations */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="trainers">Trainer Rankings</TabsTrigger>
                    <TabsTrigger value="details">Detailed Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Radar Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Multi-Dimensional Ratings</CardTitle>
                                <CardDescription>Average scores across different dimensions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="metric" />
                                        <PolarRadiusAxis angle={90} domain={[0, 5]} />
                                        <Radar name="Rating" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quality Distribution</CardTitle>
                                <CardDescription>Training quality rating breakdown</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bar Chart for Department Comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Average Ratings by Category</CardTitle>
                            <CardDescription>Comparison of different rating dimensions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={radarData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="metric" />
                                    <YAxis domain={[0, 5]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="score" fill="#3b82f6" name="Average Rating" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trainers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trainer Performance Rankings</CardTitle>
                            <CardDescription>Top trainers based on feedback ratings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Trainer Name</TableHead>
                                        <TableHead>Average Rating</TableHead>
                                        <TableHead>Total Feedbacks</TableHead>
                                        <TableHead>Performance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary?.trainerRankings.map((trainer: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">#{index + 1}</TableCell>
                                            <TableCell>{trainer.name}</TableCell>
                                            <TableCell>
                                                <span className={getRatingColor(trainer.avgRating)}>
                                                    {trainer.avgRating.toFixed(1)}/5
                                                </span>
                                            </TableCell>
                                            <TableCell>{trainer.totalFeedbacks}</TableCell>
                                            <TableCell>
                                                {trainer.avgRating >= 4 ? (
                                                    <Badge className="bg-green-100 text-green-800 border-green-300">Excellent</Badge>
                                                ) : trainer.avgRating >= 3 ? (
                                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">Good</Badge>
                                                ) : (
                                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Needs Improvement</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!summary?.trainerRankings || summary.trainerRankings.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No trainer data available
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Feedback Responses</CardTitle>
                            <CardDescription>Individual feedback submissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Learner</TableHead>
                                        <TableHead>Training</TableHead>
                                        <TableHead>Mode</TableHead>
                                        <TableHead>Quality</TableHead>
                                        <TableHead>Overall Rating</TableHead>
                                        <TableHead>Comments Preview</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary?.feedbacks.slice(0, 20).map((feedback: any) => (
                                        <TableRow key={feedback.id}>
                                            <TableCell className="text-xs">
                                                {format(new Date(feedback.submittedAt), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>{feedback.submitter.name}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {feedback.assignment.training.topicName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{feedback.assignment.training.mode}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getQualityColor(feedback.detailedFeedback?.qualityRating || 'N/A')}>
                                                    {feedback.detailedFeedback?.qualityRating || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={getRatingColor(feedback.overallRating || 0)}>
                                                    {feedback.overallRating || 0}/5
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                                                {feedback.detailedFeedback?.likeMost?.substring(0, 50) || 'No comments'}...
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!summary?.feedbacks || summary.feedbacks.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                No feedback data available
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
