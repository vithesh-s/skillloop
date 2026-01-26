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
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiDeleteBin6Line, RiAddLine, RiLinksLine } from '@remixicon/react'
import type { TrainingInput } from '@/lib/validation'

interface OnlineTrainingFormProps {
    form: UseFormReturn<any> // Using any to accomodate the complex nested form type
}

export function OnlineTrainingForm({ form }: OnlineTrainingFormProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "online.resourceLinks"
    })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <FormField
                            control={form.control}
                            name="online.estimatedDuration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Estimated Duration (Hours)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="w-full" />
                                    </FormControl>
                                    <FormDescription className="text-sm text-muted-foreground">
                                        Total time expected to complete all resources
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="online.mentorRequired"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Mentor Assignment</FormLabel>
                                    <div className="flex items-center space-x-3 rounded-md border p-4 bg-muted/30">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="mt-0.5"
                                            />
                                        </FormControl>
                                        <div className="space-y-1">
                                            <FormLabel className="font-medium cursor-pointer">
                                                Require Mentor
                                            </FormLabel>
                                            <FormDescription className="text-sm text-muted-foreground">
                                                Learners will need a mentor assigned for this training
                                            </FormDescription>
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">Resource Links</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ title: '', url: '', type: 'DOCUMENTATION' })}
                    >
                        <RiAddLine className="mr-2 h-4 w-4" />
                        Add Resource
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                    {fields.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                             No resources added. Add links to videos, docs, or courses.
                        </div>
                    )}
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border p-4 rounded-md bg-muted/30">
                            <div className="md:col-span-4">
                                <FormField
                                    control={form.control}
                                    name={`online.resourceLinks.${index}.title`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Resource Title" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-5">
                                <FormField
                                    control={form.control}
                                    name={`online.resourceLinks.${index}.url`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">URL</FormLabel>
                                            <FormControl>
                                                <div className="flex">
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground">
                                                        <RiLinksLine className="h-4 w-4" />
                                                    </span>
                                                    <Input className="rounded-l-none" placeholder="https://..." {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`online.resourceLinks.${index}.type`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="UDEMY">Udemy</SelectItem>
                                                    <SelectItem value="COURSE">Course</SelectItem>
                                                    <SelectItem value="ARTICLE">Article</SelectItem>
                                                    <SelectItem value="VIDEO">Video</SelectItem>
                                                    <SelectItem value="DOCUMENTATION">Docs</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-1 flex justify-end mt-8">
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
        </div>
    )
}
