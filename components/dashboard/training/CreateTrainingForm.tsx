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
    offline?: OfflineTrainingInput 
}

interface CreateTrainingFormProps {
    skills: { id: string; name: string; category: { name: string } }[]
    trainers: { id: string; name: string; email: string }[]
}

export function CreateTrainingForm({ skills, trainers }: CreateTrainingFormProps) {
    const [isPending, startTransition] = useTransition()
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
            }
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
                    router.push('/admin/training')
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
        <div className="container mx-auto p-6 max-w-5xl">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
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
                        </CardContent>
                    </Card>

                    {/* Mode-Specific Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-sm text-muted-foreground font-medium">
                                {mode === 'ONLINE' ? 'Online Training Configuration' : 'Offline Training Configuration'}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <Tabs value={mode} className="w-full">
                            <TabsContent value="ONLINE" className="mt-0">
                                <OnlineTrainingForm form={form} />
                            </TabsContent>
                            <TabsContent value="OFFLINE" className="mt-0">
                                <OfflineTrainingForm form={form} trainers={trainers} />
                            </TabsContent>
                        </Tabs>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
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
