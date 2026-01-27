'use client'

import { useState, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bulkTrainingAssignmentSchema } from '@/lib/validation'
import { bulkAssignTraining } from '@/actions/trainings'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RiLoader4Line, RiSearchLine, RiFilterLine, RiUserLine, RiBookOpenLine, RiCalendarLine, RiCheckLine } from '@remixicon/react'

const TARGET_LEVELS = [
    { value: 1, label: "Beginner", dbValue: "BEGINNER", description: "Just starting out", color: "bg-blue-500" },
    { value: 2, label: "Basic", dbValue: "BASIC", description: "Little experience", color: "bg-cyan-500" },
    { value: 3, label: "Intermediate", dbValue: "INTERMEDIATE", description: "Comfortable", color: "bg-green-500" },
    { value: 4, label: "Advanced", dbValue: "ADVANCED", description: "Very skilled", color: "bg-orange-500" },
    { value: 5, label: "Expert", dbValue: "EXPERT", description: "Master level", color: "bg-purple-500" },
]

interface AssignTrainingInterfaceProps {
    reportees: { 
        id: string
        name: string
        email: string
        department: string | null
        designation: string | null
        roleId: string | null
        assignedRole: { id: string; name: string } | null
    }[]
    trainings: any[]
    roles: { id: string; name: string; level: string | null }[]
}

export function AssignTrainingInterface({ reportees, trainings, roles }: AssignTrainingInterfaceProps) {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [selectedTrainingId, setSelectedTrainingId] = useState<string>('')
    const [targetLevel, setTargetLevel] = useState<number>(1)
    const [startDate, setStartDate] = useState<string>('')
    const [completionDate, setCompletionDate] = useState<string>('')
    const [isPending, startTransition] = useTransition()
    const [employeeSearch, setEmployeeSearch] = useState('')
    const [trainingSearch, setTrainingSearch] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState<string>('all')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const router = useRouter()

    // Get unique departments
    const departments = useMemo(() => {
        const depts = new Set<string>()
        reportees.forEach(r => { if (r.department) depts.add(r.department) })
        return Array.from(depts).sort()
    }, [reportees])

    // Filter employees
    const filteredReportees = useMemo(() => {
        return reportees.filter(user => {
            const matchesSearch = 
                user.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                user.email.toLowerCase().includes(employeeSearch.toLowerCase())
            const matchesDepartment = 
                departmentFilter === 'all' || user.department === departmentFilter
            const matchesRole =
                roleFilter === 'all' || user.roleId === roleFilter
            return matchesSearch && matchesDepartment && matchesRole
        })
    }, [reportees, employeeSearch, departmentFilter, roleFilter])

    // Filter trainings
    const filteredTrainings = useMemo(() => {
        return trainings.filter(training =>
            training.topicName.toLowerCase().includes(trainingSearch.toLowerCase()) ||
            training.skill?.name.toLowerCase().includes(trainingSearch.toLowerCase())
        )
    }, [trainings, trainingSearch])

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
    }

    const toggleAll = () => {
        if (selectedUsers.length === filteredReportees.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(filteredReportees.map(u => u.id))
        }
    }

    async function handleAssign() {
        if (!selectedTrainingId) return toast.error('Select a training')
        if (selectedUsers.length === 0) return toast.error('Select at least one user')
        if (!startDate || !completionDate) return toast.error('Select dates')
        if (new Date(completionDate) <= new Date(startDate)) return toast.error('Completion date must be after start date')

        const selectedLevelConfig = TARGET_LEVELS.find(l => l.value === targetLevel)
        const payload = {
            trainingId: selectedTrainingId,
            targetLevel: (selectedLevelConfig?.dbValue || 'BEGINNER') as any,
            assignments: selectedUsers.map(userId => ({
                userId,
                startDate,
                targetCompletionDate: completionDate
            }))
        }

        startTransition(async () => {
            const result = await bulkAssignTraining(payload)
            if (result.success) {
                toast.success(`Assigned training to ${result.count} users`)
                setSelectedUsers([])
                setStartDate('')
                setCompletionDate('')
                setSelectedTrainingId('')
                setTargetLevel(1)
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to assign')
            }
        })
    }

    const selectedTraining = trainings.find(t => t.id === selectedTrainingId)

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Assign Training</h1>
                <p className="text-muted-foreground mt-1">
                    Assign training programs to your team members
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <RiUserLine className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportees.length}</div>
                        <p className="text-xs text-muted-foreground">Available to assign</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Selected</CardTitle>
                        <RiUserLine className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{selectedUsers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {selectedUsers.length === 0 ? 'No employees selected' : 'Ready to assign'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Trainings</CardTitle>
                        <RiBookOpenLine className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{trainings.length}</div>
                        <p className="text-xs text-muted-foreground">Programs available</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Departments</CardTitle>
                        <RiFilterLine className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{departments.length}</div>
                        <p className="text-xs text-muted-foreground">Across organization</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Employee Selection */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Team Members</CardTitle>
                                    <CardDescription>Select employees to assign training</CardDescription>
                                </div>
                                {selectedUsers.length > 0 && (
                                    <Badge variant="secondary" className="ml-auto">
                                        {selectedUsers.length} selected
                                    </Badge>
                                )}
                            </div>
                            
                            {/* Search and Filter */}
                            <div className="flex gap-4 pt-4">
                                <div className="relative flex-1">
                                    <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={employeeSearch}
                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        {roles.map(role => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name} {role.level && `(${role.level})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox 
                                                    checked={selectedUsers.length === filteredReportees.length && filteredReportees.length > 0}
                                                    onCheckedChange={toggleAll}
                                                />
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Role</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredReportees.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    {employeeSearch || departmentFilter !== 'all' || roleFilter !== 'all'
                                                        ? 'No employees match your filters' 
                                                        : 'No reportees found'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {filteredReportees.map((user) => (
                                            <TableRow 
                                                key={user.id} 
                                                onClick={() => toggleUser(user.id)} 
                                                className="cursor-pointer hover:bg-muted/50"
                                            >
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={selectedUsers.includes(user.id)}
                                                        onCheckedChange={() => toggleUser(user.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{user.department || 'N/A'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {user.assignedRole?.name || user.designation || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assignment Configuration */}
                <div>
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RiCalendarLine className="h-5 w-5" />
                                Assignment Details
                            </CardTitle>
                            <CardDescription>Configure training assignment</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Training *</Label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                        <Input
                                            placeholder="Search trainings..."
                                            value={trainingSearch}
                                            onChange={(e) => setTrainingSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Select value={selectedTrainingId} onValueChange={setSelectedTrainingId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select training..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {filteredTrainings.length === 0 ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                    No trainings found
                                                </div>
                                            ) : (
                                                filteredTrainings.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{t.topicName}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {t.skill?.name} • {t.mode}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedTraining && (
                                    <div className="mt-2 p-3 bg-muted rounded-lg text-sm space-y-1">
                                        <p className="font-medium">{selectedTraining.topicName}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {selectedTraining.skill?.name} • {selectedTraining.duration}h • {selectedTraining.mode}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label>Target Competency Level *</Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Expected skill level after training completion
                                    </p>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {TARGET_LEVELS.map((level) => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => setTargetLevel(level.value)}
                                            className={`
                                                flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all
                                                ${targetLevel === level.value 
                                                    ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20' 
                                                    : 'border-border hover:border-primary/50 hover:bg-accent'
                                                }
                                            `}
                                        >
                                            <span className="text-xl font-bold">{level.value}</span>
                                            <span className="text-[11px] font-medium mt-0.5">{level.label}</span>
                                            <span className="text-[9px] text-muted-foreground leading-tight text-center">
                                                {level.description}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Start Date *</Label>
                                <Input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Target Completion *</Label>
                                <Input 
                                    type="date" 
                                    value={completionDate} 
                                    onChange={e => setCompletionDate(e.target.value)}
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="pt-4 space-y-2">
                                <Button 
                                    className="w-full" 
                                    onClick={handleAssign} 
                                    disabled={isPending || selectedUsers.length === 0}
                                    size="lg"
                                >
                                    {isPending && <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />}
                                    {isPending 
                                        ? 'Assigning...' 
                                        : `Assign to ${selectedUsers.length} Employee${selectedUsers.length !== 1 ? 's' : ''}`
                                    }
                                </Button>
                                {selectedUsers.length === 0 && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        Select employees to enable assignment
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
