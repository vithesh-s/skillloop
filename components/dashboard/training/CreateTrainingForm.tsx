'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trainingSchema, onlineTrainingSchema, offlineTrainingSchema } from '@/lib/validation'
import type { TrainingInput, OnlineTrainingInput, OfflineTrainingInput } from '@/lib/validation'
import { createTraining } from '@/actions/trainings'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { OnlineTrainingForm } from '@/components/training/OnlineTrainingForm'
import { OfflineTrainingForm } from '@/components/training/OfflineTrainingForm'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RiLoader4Line } from '@remixicon/react'

// Combined type for the form
// We manually construct because simple intersection might be tricky with partials in Zod
type TrainingFormData = TrainingInput & { 
    online?: OnlineTrainingInput, 
    offline?: OfflineTrainingInput,
    assessmentOwnerId?: string
}

interface CreateTrainingFormProps {
    skills: { id: string; name: string; category: { name: string } }[]
    trainers: { id: string; name: string; email: string; department: string | null; systemRoles: string[] | null }[]
    departments: string[]
    userRole: 'admin' | 'manager' | 'trainer'
}

export function CreateTrainingForm({ skills, trainers, departments, userRole }: CreateTrainingFormProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
    const router = useRouter()
    
    const form = useForm<TrainingFormData>({
        resolver: zodResolver(trainingSchema) as any, // Type assertion needed due to complex nested schema
        defaultValues: {
            topicName: '',
            description: '',
            mode: 'ONLINE',
            duration: 1,
            skillId: '',
            online: {
                resourceLinks: [],
                estimatedDuration: 1,
                mentorRequired: false
            },
            offline: {
                schedule: [],
                materials: [],
                trainerIds: [],
                venue: ''
            },
            assessmentOwnerId: ''
        }
    })

    const mode = form.watch('mode')

    async function onSubmit(data: TrainingFormData) {
        startTransition(async () => {
            try {
                // Transform data to match backend expectations
                const trainingData: any = {
                    topicName: data.topicName,
                    description: data.description,
                    mode: data.mode,
                    duration: data.duration,
                    skillId: data.skillId,
                    assessmentOwnerId: data.assessmentOwnerId || undefined,
                }

                // Add mode-specific data
                if (data.mode === 'ONLINE' && data.online) {
                    if (!data.online.resourceLinks || data.online.resourceLinks.length === 0) {
                        toast.error('Please add at least one resource link for online training')
                        return
                    }
                    trainingData.online = {
                        resourceLinks: data.online.resourceLinks,
                        estimatedDuration: data.online.estimatedDuration,
                        mentorRequired: data.online.mentorRequired
                    }
                } else if (data.mode === 'OFFLINE' && data.offline) {
                    if (!data.offline.schedule || data.offline.schedule.length === 0) {
                        toast.error('Please add at least one session for offline training')
                        return
                    }
                    if (!data.offline.trainerIds || data.offline.trainerIds.length === 0) {
                        toast.error('Please select at least one trainer for offline training')
                        return
                    }
                    if (!data.offline.venue) {
                        toast.error('Please enter a venue for offline training')
                        return
                    }
                    trainingData.offline = {
                        schedule: data.offline.schedule,
                        venue: data.offline.venue,
                        materials: data.offline.materials || [],
                        trainerIds: data.offline.trainerIds
                    }
                }

                const result = await createTraining(trainingData)
                if (result.success) {
                    toast.success('Training created successfully!')
                    const redirectPath = userRole === 'manager' ? '/manager/training' : '/admin/training'
                    router.push(redirectPath)
                    router.refresh()
                } else {
                    toast.error(result.error || 'Failed to create training')
                }
            } catch (error) {
                console.error('Submit error:', error)
                toast.error('Something went wrong. Please try again.')
            }
        })
    }

    return (
        <div className="container mx-auto py-6 max-w-5xl">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight">Create New Training</h1>
                            <p className="text-muted-foreground">
                                Define a new training topic and configure its delivery method
                            </p>
                        </div>
                        <Badge variant="secondary" className="px-4 py-2">
                            {mode === 'ONLINE' ? '🌐 Online' : '🏫 Offline'}
                        </Badge>
                    </div>

                    {/* Basic Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Core details about the training program
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="topicName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Topic Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Advanced React Patterns" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="skillId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Related Skill *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a skill" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="max-h-[300px]">
                                                    {skills.map((skill) => (
                                                        <SelectItem key={skill.id} value={skill.id}>
                                                            {skill.name} <span className="text-muted-foreground text-xs">({skill.category.name})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="What will be covered in this training..." 
                                                className="resize-none min-h-[100px]" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Provide a clear overview of the training content
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="mode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Training Mode *</FormLabel>
                                            <Select 
                                                onValueChange={(val) => {
                                                    field.onChange(val)
                                                }} 
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select mode" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ONLINE">🌐 Online</SelectItem>
                                                    <SelectItem value="OFFLINE">🏫 Offline</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Duration (Hours) *</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    min="1"
                                                    {...field} 
                                                    onChange={e => field.onChange(Number(e.target.value))} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Department Filter & Assessment Owner */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Department Filter for Assessment Owner */}
                                <div>
                                    <FormLabel>Department Filter</FormLabel>
                                    <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="All Departments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Departments</SelectItem>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept} value={dept}>
                                                    {dept}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="mt-2">
                                        Filter trainers by department
                                    </FormDescription>
                                </div>

                                {/* Assessment Owner Selection */}
                                <FormField
                                    control={form.control}
                                    name="assessmentOwnerId"
                                    render={({ field }) => {
                                        const filteredTrainers = selectedDepartment === 'all' 
                                            ? trainers 
                                            : trainers.filter(t => t.department === selectedDepartment)
                                        
                                        return (
                                            <FormItem>
                                                <FormLabel>Assessment Owner (Trainer/Mentor)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select who will create the assessment" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="max-h-[300px]">
                                                        {filteredTrainers.length === 0 ? (
                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                No trainers found in this department
                                                            </div>
                                                        ) : (
                                                            filteredTrainers.map((trainer) => (
                                                                <SelectItem key={trainer.id} value={trainer.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{trainer.name}</span>
                                                                        {trainer.systemRoles && trainer.systemRoles.length > 0 && (
                                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                                                {trainer.systemRoles[0]}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-muted-foreground text-xs block">
                                                                        {trainer.email}{trainer.department ? ` • ${trainer.department}` : ''}
                                                                    </span>
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    This person will be responsible for adding assessment questions
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mode-Specific Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {mode === 'ONLINE' ? 'Online Training Configuration' : 'Offline Training Configuration'}
                            </CardTitle>
                            <CardDescription>
                                {mode === 'ONLINE' 
                                    ? 'Configure resources and mentor requirements' 
                                    : 'Set up schedule, trainers, and venue details'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={mode} className="w-full">
                                <TabsContent value="ONLINE" className="mt-0">
                                    <OnlineTrainingForm form={form} />
                                </TabsContent>
                                <TabsContent value="OFFLINE" className="mt-0">
                                    <OfflineTrainingForm form={form} trainers={trainers} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-6">
                        <Button type="button" variant="outline" onClick={() => router.back()} size="lg">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending} size="lg">
                            {isPending && <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? 'Creating...' : 'Create Training'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
