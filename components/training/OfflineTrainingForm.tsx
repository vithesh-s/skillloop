'use client'

import { UseFormReturn, useFieldArray } from 'react-hook-form'
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiDeleteBin6Line, RiAddLine, RiCalendarLine, RiMapPinLine } from '@remixicon/react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

interface OfflineTrainingFormProps {
    form: UseFormReturn<any>
    trainers: { id: string; name: string; email: string }[]
}

export function OfflineTrainingForm({ form, trainers }: OfflineTrainingFormProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "offline.schedule"
    })

    const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
        control: form.control,
        name: "offline.materials"
    })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="offline.venue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Venue / Location</FormLabel>
                            <FormControl>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground">
                                        <RiMapPinLine className="h-4 w-4" />
                                    </span>
                                    <Input className="rounded-l-none" placeholder="Conference Room A" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="offline.trainerIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trainers</FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={(value) => {
                                        // Simple hack for multi-select simulation if needed, or just single for MVP if easier.
                                        // But schema says array. Let's assume we pick one main trainer here or implement custom multi-select.
                                        // Reverting to native multiple select for robustness
                                        const current = field.value || []
                                        if (!current.includes(value)) {
                                            field.onChange([...current, value])
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Trainers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trainers.map((trainer) => (
                                            <SelectItem key={trainer.id} value={trainer.id}>
                                                {trainer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            {/* Display selected trainers */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(field.value || []).map((id: string) => {
                                    const trainer = trainers.find(t => t.id === id)
                                    return trainer ? (
                                        <div key={id} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center">
                                            {trainer.name}
                                            <button 
                                                type="button" 
                                                onClick={() => field.onChange(field.value.filter((val: string) => val !== id))}
                                                className="ml-2 hover:text-destructive"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ) : null
                                })}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">Training Schedule</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ date: '', startTime: '', endTime: '', sessionTitle: '' })}
                    >
                        <RiAddLine className="mr-2 h-4 w-4" />
                        Add Session
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                    {fields.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                             No sessions scheduled. Add dates and times.
                        </div>
                    )}
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border p-4 rounded-md bg-muted/30">
                             <div className="md:col-span-3">
                                <FormField
                                    control={form.control}
                                    name={`offline.schedule.${index}.date`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                             <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`offline.schedule.${index}.startTime`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Start</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                             <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`offline.schedule.${index}.endTime`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">End</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                             <div className="md:col-span-4">
                                <FormField
                                    control={form.control}
                                    name={`offline.schedule.${index}.sessionTitle`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Session Title (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Introduction..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                             <div className="md:col-span-1 flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive/90"
                                    onClick={() => remove(index)}
                                >
                                    <RiDeleteBin6Line className="h-4 w-4" />
                                </Button>
                             </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">Training Materials</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendMaterial({ name: '', url: '', type: 'DOCUMENT' })}
                    >
                        <RiAddLine className="mr-2 h-4 w-4" />
                        Add Material
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                    {materialFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border p-4 rounded-md bg-muted/30">
                            <div className="md:col-span-4">
                                <Input 
                                    placeholder="Material Name" 
                                    {...form.register(`offline.materials.${index}.name`)} 
                                />
                            </div>
                            <div className="md:col-span-6">
                                <Input 
                                    placeholder="Download URL" 
                                    {...form.register(`offline.materials.${index}.url`)} 
                                />
                            </div>
                             <div className="md:col-span-2 flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive/90"
                                    onClick={() => removeMaterial(index)}
                                >
                                    <RiDeleteBin6Line className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
