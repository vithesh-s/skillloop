'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitFeedback } from '@/actions/feedback'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { feedbackSchema, type FeedbackInput } from '@/lib/validation'
import { CheckCircle2, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { toast } from 'sonner'

interface FeedbackFormPageProps {
    params: {
        id: string
    }
}

const TOTAL_STEPS = 3

export default function FeedbackFormPage({ params }: FeedbackFormPageProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [isPending, startTransition] = useTransition()
    const [isSubmitted, setIsSubmitted] = useState(false)
    const router = useRouter()

    const form = useForm<FeedbackInput>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            assignmentId: params.id,
            likeMost: '',
            keyLearnings: '',
            confusingTopics: '',
            materialHelpful: 3,
            interactiveEngaging: 3,
            trainerAnswered: 3,
            qualityRating: 'Good',
            contentSatisfaction: 3,
            competentConfident: '',
            suggestions: '',
        },
    })

    const onSubmit = (data: FeedbackInput) => {
        startTransition(async () => {
            try {
                await submitFeedback(data)
                setIsSubmitted(true)
                toast.success('Feedback submitted successfully!', {
                    description: 'Thank you for your valuable feedback.',
                })
                setTimeout(() => {
                    router.push('/employee/training')
                }, 2000)
            } catch (error: any) {
                toast.error('Failed to submit feedback', {
                    description: error.message || 'Please try again',
                })
            }
        })
    }

    const progress = (currentStep / TOTAL_STEPS) * 100

    const nextStep = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const RatingInput = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label?: string }) => (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => onChange(rating)}
                        className={`p-2 rounded-full transition-all ${
                            rating <= value
                                ? 'text-yellow-500 scale-110'
                                : 'text-gray-300 hover:text-yellow-400'
                        }`}
                    >
                        <Star className={`h-8 w-8 ${rating <= value ? 'fill-current' : ''}`} />
                    </button>
                ))}
                <span className="ml-2 text-sm font-medium">{value}/5</span>
            </div>
        </div>
    )

    if (isSubmitted) {
        return (
            <div className="container max-w-2xl mx-auto py-10">
                <Card className="text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <CardTitle>Thank You!</CardTitle>
                        <CardDescription>
                            Your feedback has been submitted successfully. Redirecting...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Training Feedback</CardTitle>
                    <CardDescription>
                        Help us improve by sharing your training experience
                    </CardDescription>
                    <div className="space-y-2 pt-4">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Step {currentStep} of {TOTAL_STEPS}</span>
                            <span>{Math.round(progress)}% Complete</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </CardHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            {/* Step 1: Open-ended questions */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold">Your Experience</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Tell us about your training experience in your own words
                                        </p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="likeMost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>1. What did you like the most about the training? Was it relevant to your job?</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Share what you enjoyed most about the training..."
                                                        className="min-h-25"
                                                        maxLength={1000}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {field.value?.length || 0}/1000 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="keyLearnings"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>2. List 2-3 key learnings. How will you apply them?</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="List your key takeaways and how you'll use them..."
                                                        className="min-h-25"
                                                        maxLength={1000}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {field.value?.length || 0}/1000 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confusingTopics"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>3. Were there any confusing topics? (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Share any topics that were unclear..."
                                                        className="min-h-25"
                                                        maxLength={1000}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {field.value?.length || 0}/1000 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {/* Step 2: Rating scales */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold">Rate Your Experience</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Rate different aspects of the training on a scale of 1 to 5
                                        </p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="materialHelpful"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>4. Was the training material and content helpful?</FormLabel>
                                                <FormControl>
                                                    <RatingInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="interactiveEngaging"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>5. Was the training program interactive and engaging?</FormLabel>
                                                <FormControl>
                                                    <RatingInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="trainerAnswered"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>6. Was the trainer able to answer all your questions?</FormLabel>
                                                <FormControl>
                                                    <RatingInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="qualityRating"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>7. How would you rate the quality of this training session?</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="grid grid-cols-2 gap-4"
                                                    >
                                                        {['Excellent', 'Good', 'Average', 'Below Average'].map((option) => (
                                                            <div key={option} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={option} id={option} />
                                                                <Label htmlFor={option} className="cursor-pointer">
                                                                    {option}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="contentSatisfaction"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>8. Were you satisfied with the learning content and material?</FormLabel>
                                                <FormControl>
                                                    <RatingInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {/* Step 3: Final thoughts */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold">Final Thoughts</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Share your confidence level and suggestions for improvement
                                        </p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="competentConfident"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>9. Do you feel competent and confident after the training?</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Share your confidence level and any concerns or knowledge gaps..."
                                                        className="min-h-30"
                                                        maxLength={1000}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {field.value?.length || 0}/1000 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="suggestions"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>10. Any suggestions to improve the training program? (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Share your ideas for improvement..."
                                                        className="min-h-30"
                                                        maxLength={1000}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {field.value?.length || 0}/1000 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-between border-t pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>

                            {currentStep < TOTAL_STEPS ? (
                                <Button type="button" onClick={nextStep}>
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? 'Submitting...' : 'Submit Feedback'}
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}
