'use client'

import { useEffect, useState } from 'react'
import { getTrainingEffectiveness } from '@/actions/feedback'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    ComposedChart,
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Award, Users, Download } from 'lucide-react'

interface TrainingEffectivenessChartProps {
    skillId?: string
    trainingId?: string
}

export function TrainingEffectivenessChart({ skillId, trainingId }: TrainingEffectivenessChartProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])
    const [selectedSkill, setSelectedSkill] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [skillId, trainingId])

    const loadData = async () => {
        setLoading(true)
        try {
            const result = await getTrainingEffectiveness({ skillId, trainingId })
            if (result.success) {
                setData(result.data)
                if (result.data.length > 0) {
                    setSelectedSkill(result.data[0])
                }
            }
        } catch (error) {
            console.error('Failed to load effectiveness data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        if (!selectedSkill) return

        const headers = ['Learner', 'Department', 'Pre-Assessment', 'Post-Assessment', 'Improvement', 'Improvement %', 'Passed']
        const rows = selectedSkill.userResults.map((r: any) => [
            r.userName,
            r.department || 'N/A',
            r.preScore.toFixed(1),
            r.postScore.toFixed(1),
            r.improvement.toFixed(1),
            r.improvementPercent.toFixed(1),
            r.passed ? 'Yes' : 'No',
        ])

        const csv = [
            headers.join(','),
            ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')),
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `training-effectiveness-${selectedSkill.skillName}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-10">
                    <div className="text-center text-muted-foreground">
                        Loading effectiveness data...
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="py-10">
                    <div className="text-center text-muted-foreground">
                        No training effectiveness data available yet
                    </div>
                </CardContent>
            </Card>
        )
    }

    const prePostData = selectedSkill ? selectedSkill.userResults.slice(0, 10).map((r: any) => ({
        name: r.userName.split(' ')[0], // First name only
        pre: r.preScore,
        post: r.postScore,
    })) : []

    const distributionData = selectedSkill ? [
        { range: 'Negative', count: selectedSkill.improvementDistribution.negative, color: '#ef4444' },
        { range: '0-20%', count: selectedSkill.improvementDistribution.low, color: '#f59e0b' },
        { range: '20-50%', count: selectedSkill.improvementDistribution.medium, color: '#3b82f6' },
        { range: '>50%', count: selectedSkill.improvementDistribution.high, color: '#10b981' },
    ] : []

    const getImprovementColor = (improvement: number) => {
        if (improvement < 0) return 'text-red-600'
        if (improvement < 20) return 'text-yellow-600'
        if (improvement < 50) return 'text-blue-600'
        return 'text-green-600'
    }

    const getImprovementBadge = (improvement: number) => {
        if (improvement < 0) return <Badge className="bg-red-100 text-red-800 border-red-300">Declined</Badge>
        if (improvement < 20) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Slight</Badge>
        if (improvement < 50) return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Good</Badge>
        return <Badge className="bg-green-100 text-green-800 border-green-300">Excellent</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Skill Selector */}
            {data.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select Skill/Training</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {data.map((item) => (
                                <Button
                                    key={item.skillId}
                                    variant={selectedSkill?.skillId === item.skillId ? 'default' : 'outline'}
                                    onClick={() => setSelectedSkill(item)}
                                >
                                    {item.skillName} ({item.totalLearners})
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedSkill && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{selectedSkill.totalLearners}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${getImprovementColor(selectedSkill.avgImprovement)}`}>
                                    {selectedSkill.avgImprovement > 0 ? '+' : ''}{selectedSkill.avgImprovement}%
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {selectedSkill.passRate}%
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Avg Post Score</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {selectedSkill.avgPostScore}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    From {selectedSkill.avgPreScore}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <Tabs defaultValue="comparison" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <TabsList>
                                <TabsTrigger value="comparison">Pre vs Post</TabsTrigger>
                                <TabsTrigger value="distribution">Distribution</TabsTrigger>
                                <TabsTrigger value="details">Detailed Results</TabsTrigger>
                            </TabsList>
                            <Button onClick={handleExport} variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>

                        <TabsContent value="comparison" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pre vs Post Assessment Scores</CardTitle>
                                    <CardDescription>
                                        Comparison of top 10 learners' performance
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={prePostData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis domain={[0, 100]} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="pre" fill="#94a3b8" name="Pre-Assessment" />
                                            <Bar dataKey="post" fill="#3b82f6" name="Post-Assessment" />
                                            <Line type="monotone" dataKey="post" stroke="#10b981" strokeWidth={2} name="Trend" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Mean Improvement</p>
                                            <p className={`text-xl font-bold ${getImprovementColor(selectedSkill.avgImprovement)}`}>
                                                {selectedSkill.avgImprovement}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Pre-Assessment Avg</p>
                                            <p className="text-xl font-bold">{selectedSkill.avgPreScore}%</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Post-Assessment Avg</p>
                                            <p className="text-xl font-bold">{selectedSkill.avgPostScore}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="distribution" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Improvement Distribution</CardTitle>
                                    <CardDescription>
                                        Number of learners in each improvement range
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={distributionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="range" />
                                            <YAxis label={{ value: 'Number of Learners', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip />
                                            <Bar dataKey="count" name="Learners">
                                                {distributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="details" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Individual Learner Results</CardTitle>
                                    <CardDescription>
                                        Detailed breakdown of each learner's performance
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Learner</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Pre-Score</TableHead>
                                                <TableHead>Post-Score</TableHead>
                                                <TableHead>Improvement</TableHead>
                                                <TableHead>Performance</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedSkill.userResults.map((result: any) => (
                                                <TableRow key={result.userId}>
                                                    <TableCell className="font-medium">{result.userName}</TableCell>
                                                    <TableCell>{result.department || 'N/A'}</TableCell>
                                                    <TableCell>{result.preScore.toFixed(1)}%</TableCell>
                                                    <TableCell className="font-semibold">{result.postScore.toFixed(1)}%</TableCell>
                                                    <TableCell>
                                                        <span className={getImprovementColor(result.improvement)}>
                                                            {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getImprovementBadge(result.improvement)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {result.passed ? (
                                                            <Badge className="bg-green-100 text-green-800 border-green-300">Passed</Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
}
