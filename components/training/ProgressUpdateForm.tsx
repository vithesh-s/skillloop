'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { progressUpdateSchema, type ProgressUpdateInput } from '@/lib/validation'
import { createProgressUpdate } from '@/actions/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, ChevronDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProgressUpdateFormProps {
    assignmentId: string
    currentWeek: number
    previousProgress?: {
        weekNumber: number
        completionPercentage: number
        topicsCovered?: string | null
        timeSpent?: number | null
        challenges?: string | null
        nextPlan?: string | null
        createdAt: Date
    }
}

export function ProgressUpdateForm({ assignmentId, currentWeek, previousProgress }: ProgressUpdateFormProps) {
    const [isPending, startTransition] = useTransition()
    const [showPrevious, setShowPrevious] = useState(false)
    const [completion, setCompletion] = useState(0)
    const [date, setDate] = useState<Date>(new Date())

    const form = useForm<Omit<ProgressUpdateInput, 'updateDate'> & { updateDate: Date }>({
        resolver: zodResolver(progressUpdateSchema),
        defaultValues: {
            assignmentId,
            weekNumber: currentWeek,
            completionPercentage: 0,
            topicsCovered: '',
            timeSpent: 0,
            challenges: '',
            nextPlan: '',
            updateDate: new Date()
        }
    })

    const onSubmit = (data: Omit<ProgressUpdateInput, 'updateDate'> & { updateDate: Date }) => {
        startTransition(async () => {
            const result = await createProgressUpdate({
                ...data,
                updateDate: data.updateDate
            })

            if (result.success) {
                toast.success('Progress updated successfully!', {
                    description: `Week ${data.weekNumber} - ${data.completionPercentage}% complete`
                })
                form.reset({
                    assignmentId,
                    weekNumber: currentWeek + 1,
                    completionPercentage: 0,
                    topicsCovered: '',
                    timeSpent: 0,
                    challenges: '',
                    nextPlan: '',
                    updateDate: new Date()
                })
                setCompletion(0)
            } else {
                toast.error('Failed to update progress', {
                    description: result.error
                })
            }
        })
    }

    const completionColor = 
        completion >= 80 ? 'from-green-500 to-emerald-600' :
        completion >= 50 ? 'from-blue-500 to-cyan-600' :
        completion >= 25 ? 'from-amber-500 to-orange-600' :
        'from-gray-400 to-gray-500'

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Show Previous Week's Data */}
            {previousProgress && (
                <Collapsible open={showPrevious} onOpenChange={setShowPrevious}>
                    <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-between">
                            <span>View Previous Week's Progress</span>
                            <ChevronDown className={cn(
                                "h-4 w-4 transition-transform",
                                showPrevious && "rotate-180"
                            )} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Week {previousProgress.weekNumber}</span>
                                <span className="text-muted-foreground">
                                    {format(new Date(previousProgress.createdAt), 'PPP')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Completion:</span>
                                <span className="font-semibold">{previousProgress.completionPercentage}%</span>
                            </div>
                            {previousProgress.topicsCovered && (
                                <div>
                                    <span className="text-muted-foreground">Topics:</span>
                                    <p className="mt-1">{previousProgress.topicsCovered}</p>
                                </div>
                            )}
                            {previousProgress.timeSpent && (
                                <div>
                                    <span className="text-muted-foreground">Time Spent:</span>
                                    <span className="ml-2 font-semibold">{previousProgress.timeSpent} hours</span>
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}

            {/* Week Number (Read-only) */}
            <div className="space-y-2">
                <Label>Week Number</Label>
                <Input 
                    value={`Week ${currentWeek}`} 
                    disabled 
                    className="font-semibold"
                />
            </div>

            {/* Completion Percentage with Visual Slider */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="completionPercentage">Completion Percentage</Label>
                    <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold text-white",
                        `bg-linear-to-r ${completionColor}`
                    )}>
                        {completion}%
                    </div>
                </div>
                <Slider
                    id="completionPercentage"
                    min={0}
                    max={100}
                    step={5}
                    value={[completion]}
                    onValueChange={(value) => {
                        setCompletion(value[0])
                        form.setValue('completionPercentage', value[0])
                    }}
                    className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                </div>
            </div>

            {/* Topics Covered */}
            <div className="space-y-2">
                <Label htmlFor="topicsCovered">Topics Covered This Week</Label>
                <Textarea
                    id="topicsCovered"
                    placeholder="List the main topics or modules you completed..."
                    rows={3}
                    {...form.register('topicsCovered')}
                />
                {form.formState.errors.topicsCovered && (
                    <p className="text-sm text-destructive">{form.formState.errors.topicsCovered.message}</p>
                )}
            </div>

            {/* Time Spent */}
            <div className="space-y-2">
                <Label htmlFor="timeSpent">Time Spent (hours)</Label>
                <Input
                    id="timeSpent"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g., 5.5"
                    {...form.register('timeSpent', { valueAsNumber: true })}
                />
                {form.formState.errors.timeSpent && (
                    <p className="text-sm text-destructive">{form.formState.errors.timeSpent.message}</p>
                )}
            </div>

            {/* Challenges Faced */}
            <div className="space-y-2">
                <Label htmlFor="challenges">Challenges or Blockers (Optional)</Label>
                <Textarea
                    id="challenges"
                    placeholder="Describe any difficulties or questions you encountered..."
                    rows={3}
                    {...form.register('challenges')}
                />
            </div>

            {/* Next Week's Plan */}
            <div className="space-y-2">
                <Label htmlFor="nextPlan">Plan for Next Week (Optional)</Label>
                <Textarea
                    id="nextPlan"
                    placeholder="What do you plan to work on next week..."
                    rows={3}
                    {...form.register('nextPlan')}
                />
            </div>

            {/* Update Date */}
            <div className="space-y-2">
                <Label>Update Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'PPP') : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => {
                                if (newDate) {
                                    setDate(newDate)
                                    form.setValue('updateDate', newDate)
                                }
                            }}
                            disabled={(date) => date > new Date()}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                {form.formState.errors.updateDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.updateDate.message}</p>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4">
                <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isPending || completion === 0}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Submit Progress
                        </>
                    )}
                </Button>
            </div>

            {/* Helpful Tips */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                    <strong>Tip:</strong> Update your progress weekly to keep your mentor informed and get timely feedback.
                </AlertDescription>
            </Alert>
        </form>
    )
}
