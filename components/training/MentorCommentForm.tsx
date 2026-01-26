'use client'

import { useState, useTransition } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { addMentorComment } from '@/actions/progress'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MentorCommentFormProps {
    progressId: string
    existingComment?: string | null
}

export function MentorCommentForm({ progressId, existingComment }: MentorCommentFormProps) {
    const [isPending, startTransition] = useTransition()
    const [comment, setComment] = useState(existingComment || '')
    const [isEditing, setIsEditing] = useState(!existingComment)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!comment.trim()) {
            toast.error('Comment cannot be empty')
            return
        }

        startTransition(async () => {
            const result = await addMentorComment({
                progressId,
                comment: comment.trim()
            })

            if (result.success) {
                toast.success('Feedback added successfully!', {
                    description: 'Trainee has been notified'
                })
                setIsEditing(false)
            } else {
                toast.error(result.error || 'Failed to add feedback')
            }
        })
    }

    if (!isEditing && existingComment) {
        return (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-emerald-600">Your Feedback</p>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    >
                        Edit
                    </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{existingComment}</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
                placeholder="Provide feedback on this week's progress..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                disabled={isPending}
                maxLength={1000}
            />
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {comment.length}/1000 characters
                </p>
                <div className="flex gap-2">
                    {existingComment && (
                        <Button 
                            type="button"
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                setComment(existingComment)
                                setIsEditing(false)
                            }}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button 
                        type="submit" 
                        size="sm"
                        disabled={isPending || !comment.trim()}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                {existingComment ? 'Update' : 'Send'} Feedback
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    )
}
