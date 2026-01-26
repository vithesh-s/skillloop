'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trainingCompletionSchema, TrainingCompletionInput } from '@/lib/validation'
import { updateTrainingCompletion } from '@/actions/trainings'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RiLoader4Line } from '@remixicon/react'

interface TrainingCompletionDialogProps {
    assignment: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TrainingCompletionDialog({ assignment, open, onOpenChange }: TrainingCompletionDialogProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const form = useForm<TrainingCompletionInput>({
        resolver: zodResolver(trainingCompletionSchema) as any,
        defaultValues: {
            assignmentId: assignment.id,
            actualDuration: assignment.training.duration || 1,
            methodOfTraining: assignment.training.mode === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
        }
    })

    async function onSubmit(data: TrainingCompletionInput) {
        startTransition(async () => {
            const result = await updateTrainingCompletion(data)
            if (result.success) {
                toast.success('Training marked as completed!')
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to update')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Complete Training</DialogTitle>
                    <DialogDescription>
                        Fill in the details of your completed training: {assignment.training.topicName}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="actualDateFrom"
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
                                name="actualDateTo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="actualDuration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (Hours)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="typeOfTraining"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Training Type</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Technical, Soft Skills" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="methodOfTraining"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Method of Training</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ONLINE">Online</SelectItem>
                                            <SelectItem value="OFFLINE">Offline</SelectItem>
                                            <SelectItem value="HYBRID">Hybrid</SelectItem>
                                            <SelectItem value="SELF_PACED">Self-Paced</SelectItem>
                                            <SelectItem value="INSTRUCTOR_LED">Instructor-Led</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="trainingInstitute"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Training Institute (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Institute name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Venue or platform" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="trainerDetails"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trainer Details (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Name, qualifications, contact..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium">Certificate Details (Optional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="certificateDetails.certificateNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Certificate Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="certificateDetails.issuingAuthority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Issuing Authority</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="certificateDetails.certificateUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Certificate URL</FormLabel>
                                            <FormControl>
                                                <Input type="url" placeholder="https://..." {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Upload to cloud storage and paste link
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="certificateDetails.expiryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expiry Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any additional notes..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Completion
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
