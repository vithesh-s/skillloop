'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { reviewProof } from '@/actions/proofs'
import { FileText, Image, File, Download, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ProofReviewCardProps {
    proof: {
        id: string
        fileName: string
        filePath: string
        description?: string | null
        uploadDate: Date
    }
}

export function ProofReviewCard({ proof }: ProofReviewCardProps) {
    const [isPending, startTransition] = useTransition()
    const [comments, setComments] = useState('')
    const [action, setAction] = useState<'APPROVED' | 'REJECTED' | null>(null)

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
            return <Image className="h-5 w-5" />
        }
        if (ext === 'pdf') {
            return <FileText className="h-5 w-5" />
        }
        return <File className="h-5 w-5" />
    }

    const handleReview = (status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !comments.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }

        setAction(status)
    }

    const confirmReview = () => {
        if (!action) return

        startTransition(async () => {
            const result = await reviewProof({
                proofId: proof.id,
                status: action,
                reviewerComments: comments.trim() || undefined
            })

            if (result.success) {
                toast.success(
                    action === 'APPROVED' 
                        ? 'Proof approved! Training marked as completed.'
                        : 'Proof rejected. Trainee has been notified.'
                )
                // Refresh page to update status
                window.location.reload()
            } else {
                toast.error(result.error || 'Failed to review proof')
            }

            setAction(null)
        })
    }

    // Check if image for preview
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
        proof.fileName.split('.').pop()?.toLowerCase() || ''
    )

    return (
        <div className="space-y-4">
            {/* File Preview/Info */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
                <div className="p-2 rounded-lg bg-background">
                    {getFileIcon(proof.fileName)}
                </div>
                <div className="flex-1">
                    <p className="font-medium">{proof.fileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Uploaded {format(new Date(proof.uploadDate), 'PPP')}
                    </p>
                    {proof.description && (
                        <p className="text-sm mt-2 text-muted-foreground">{proof.description}</p>
                    )}
                </div>
                <a 
                    href={proof.filePath} 
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        View
                    </Button>
                </a>
            </div>

            {/* Image Preview */}
            {isImage && (
                <div className="border rounded-lg overflow-hidden">
                    <img 
                        src={proof.filePath} 
                        alt={proof.fileName}
                        className="w-full h-auto max-h-100 object-contain bg-muted"
                    />
                </div>
            )}

            {/* Review Comments */}
            <div className="space-y-2">
                <Label htmlFor="comments">Reviewer Comments (Optional for approval, Required for rejection)</Label>
                <Textarea
                    id="comments"
                    placeholder="Provide feedback or reason for rejection..."
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    disabled={isPending}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <AlertDialog open={action === 'APPROVED'} onOpenChange={(open) => !open && setAction(null)}>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="default" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleReview('APPROVED')}
                            disabled={isPending}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Approve Proof of Completion?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will mark the training as completed and update the trainee's skill matrix. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmReview}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Approving...
                                    </>
                                ) : (
                                    'Confirm Approval'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={action === 'REJECTED'} onOpenChange={(open) => !open && setAction(null)}>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => handleReview('REJECTED')}
                            disabled={isPending}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Reject Proof of Completion?</AlertDialogTitle>
                            <AlertDialogDescription>
                                The trainee will be notified and can submit a new proof. Please ensure you've provided a reason in the comments.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmReview}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={!comments.trim()}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Rejecting...
                                    </>
                                ) : (
                                    'Confirm Rejection'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                    <strong>Review Carefully:</strong> Approving this proof will automatically mark the training as completed and update the skill matrix.
                </AlertDescription>
            </Alert>
        </div>
    )
}
