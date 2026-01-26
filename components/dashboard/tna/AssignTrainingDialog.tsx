'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { assignFromTNA } from '@/actions/trainings'
import type { TNAReport } from '@/types/skill-matrix'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { RiLoader4Line, RiAlertLine } from '@remixicon/react'

interface AssignTrainingDialogProps {
    selectedEmployees: TNAReport[]
    open: boolean
    onOpenChange: (open: boolean) => void
    availableTrainings?: Array<{
        id: string
        topicName: string
        mode: string
        skillId: string
        skill: { name: string }
    }>
}

const assignmentSchema = z.object({
    skillId: z.string().min(1, 'Please select a skill'),
    assignmentType: z.enum(['existing', 'new']),
    existingTrainingId: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    targetCompletionDate: z.string().min(1, 'Completion date is required'),
}).refine(
    (data) => data.assignmentType === 'new' || !!data.existingTrainingId,
    { message: 'Please select a training', path: ['existingTrainingId'] }
)

type AssignmentFormData = z.infer<typeof assignmentSchema>


export function AssignTrainingDialog({
    selectedEmployees,
    open,
    onOpenChange,
    availableTrainings = []
}: AssignTrainingDialogProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedSkillId, setSelectedSkillId] = useState<string>('')

    const form = useForm<AssignmentFormData>({
        resolver: zodResolver(assignmentSchema) as any,
        defaultValues: {
            assignmentType: 'existing',
            startDate: new Date().toISOString().split('T')[0],
            targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
    })

    // Get all unique skills with gaps from selected employees
    const skillsWithGaps = Array.from(
        new Map(
            selectedEmployees.flatMap(emp =>
                emp.skillGaps
                    .filter(gap => gap.gapCategory === 'CRITICAL' || gap.gapCategory === 'HIGH')
                    .map(gap => [gap.skillId, gap])
            )
        ).values()
    )

    // Filter trainings by selected skill
    const filteredTrainings = selectedSkillId
        ? availableTrainings.filter(t => t.skillId === selectedSkillId)
        : []

    async function onSubmit(data: AssignmentFormData) {
        if (!selectedSkillId) {
            toast.error('Please select a skill')
            return
        }

        startTransition(async () => {
            try {
                const result = await assignFromTNA({
                    skillId: selectedSkillId,
                    userIds: selectedEmployees.map(emp => emp.userId),
                    createNewTraining: data.assignmentType === 'new',
                    existingTrainingId: data.assignmentType === 'existing' ? data.existingTrainingId : undefined,
                    trainingData: undefined, // Will be handled separately if creating new
                    startDate: data.startDate,
                    targetCompletionDate: data.targetCompletionDate,
                })

                if (result.success) {
                    toast.success(`Training assigned to ${selectedEmployees.length} employee(s)`)
                    onOpenChange(false)
                    form.reset()
                } else {
                    toast.error(result.error || 'Failed to assign training')
                }
            } catch (error) {
                toast.error('Something went wrong')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assign Training from TNA</DialogTitle>
                    <DialogDescription>
                        Assign training to {selectedEmployees.length} selected employee(s) based on their skill gaps
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Selected Employees Summary */}
                    <div className="rounded-lg border p-4 space-y-2">
                        <h4 className="font-medium text-sm">Selected Employees</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedEmployees.map(emp => (
                                <Badge key={emp.userId} variant="secondary">
                                    {emp.userName}
                                    {emp.criticalGapsCount > 0 && (
                                        <span className="ml-1 text-destructive">
                                            ({emp.criticalGapsCount} critical)
                                        </span>
                                    )}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Critical Skills with Gaps */}
                    <div className="rounded-lg border p-4 space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <RiAlertLine className="h-4 w-4 text-destructive" />
                            Critical & High Priority Skills
                        </h4>
                        <div className="space-y-2">
                            {skillsWithGaps.length > 0 ? (
                                <RadioGroup value={selectedSkillId} onValueChange={setSelectedSkillId}>
                                    {skillsWithGaps.map(gap => (
                                        <div key={gap.skillId} className="flex items-center space-x-2">
                                            <RadioGroupItem value={gap.skillId} id={gap.skillId} />
                                            <Label htmlFor={gap.skillId} className="flex-1 cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <span>{gap.skillName}</span>
                                                    <Badge variant={gap.gapCategory === 'CRITICAL' ? 'destructive' : 'default'}>
                                                        {gap.gapCategory}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{gap.categoryName}</p>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <p className="text-sm text-muted-foreground">No critical or high priority gaps found</p>
                            )}
                        </div>
                    </div>

                    {/* Assignment Form */}
                    {selectedSkillId && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="assignmentType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Training Source</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex gap-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="existing" id="existing" />
                                                        <Label htmlFor="existing">Existing Training</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="new" id="new" />
                                                        <Label htmlFor="new">Create New Training</Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {form.watch('assignmentType') === 'existing' && (
                                    <FormField
                                        control={form.control}
                                        name="existingTrainingId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select Training</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a training" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {filteredTrainings.length > 0 ? (
                                                            filteredTrainings.map(training => (
                                                                <SelectItem key={training.id} value={training.id}>
                                                                    {training.topicName} ({training.mode})
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem value="none" disabled>
                                                                No trainings available for this skill
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    {filteredTrainings.length} training(s) available for selected skill
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {form.watch('assignmentType') === 'new' && (
                                    <div className="rounded-lg border p-4 bg-muted/50">
                                        <p className="text-sm text-muted-foreground">
                                            Creating a new training will redirect you to the training creation page after assignment.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="targetCompletionDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Target Completion</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isPending}>
                                        {isPending && <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />}
                                        Assign Training
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
