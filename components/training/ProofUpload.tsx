'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { UploadDropzone } from '@/lib/uploadthing'
import { deleteProof } from '@/actions/proofs'
import { FileText, Image, File, Download, Trash2, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Proof {
    id: string
    fileName: string
    filePath: string
    description?: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    uploadDate: Date
    reviewedAt?: Date | null
    reviewerComments?: string | null
    reviewer?: {
        name: string
    } | null
}

interface ProofUploadProps {
    assignmentId: string
    existingProofs: Proof[]
}

export function ProofUpload({ assignmentId, existingProofs }: ProofUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [proofs, setProofs] = useState<Proof[]>(existingProofs)

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

    const getStatusBadge = (status: Proof['status']) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                    </Badge>
                )
            case 'REJECTED':
                return (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Rejected
                    </Badge>
                )
            default:
                return (
                    <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending Review
                    </Badge>
                )
        }
    }

    const handleDelete = async (proofId: string) => {
        const proof = proofs.find(p => p.id === proofId)
        if (!proof) return

        if (proof.status !== 'PENDING') {
            toast.error('Cannot delete reviewed proofs')
            return
        }

        const confirmed = confirm('Are you sure you want to delete this proof?')
        if (!confirmed) return

        const result = await deleteProof(proofId)
        if (result.success) {
            setProofs(prev => prev.filter(p => p.id !== proofId))
            toast.success('Proof deleted successfully')
        } else {
            toast.error(result.error || 'Failed to delete proof')
        }
    }

    return (
        <div className="space-y-6">
            {/* Upload Zone */}
            <Card className="p-6 border-2 border-dashed">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Accepted File Types:</p>
                            <p>PDF, Images (JPG, PNG), Word Documents (DOC, DOCX)</p>
                            <p className="mt-1">Maximum file size: 10MB per file, up to 3 files</p>
                        </div>
                    </div>

                    {uploading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </div>
                        </div>
                    ) : (
                        <UploadDropzone
                            endpoint="proofUploader"
                            config={{ 
                                mode: "manual",
                                appendOnPaste: false 
                            }}
                            onBeforeUploadBegin={(files) => {
                                // Add assignmentId to metadata before upload
                                return files.map((file) => 
                                    Object.assign(file, { 
                                        customId: assignmentId,
                                        metadata: { assignmentId } 
                                    })
                                )
                            }}
                            onClientUploadComplete={(res: any) => {
                                setUploading(false)
                                if (res && res.length > 0) {
                                    toast.success('Files uploaded successfully!', {
                                        description: `${res.length} file(s) submitted for review`
                                    })
                                    // Refresh page to show new proofs
                                    window.location.reload()
                                }
                            }}
                            onUploadError={(error: Error) => {
                                setUploading(false)
                                toast.error('Upload failed', {
                                    description: error.message
                                })
                            }}
                            onUploadBegin={() => {
                                setUploading(true)
                            }}
                            appearance={{
                                container: {
                                    border: '2px dashed hsl(var(--border))',
                                    borderRadius: '0.5rem',
                                },
                                uploadIcon: {
                                    color: 'hsl(var(--primary))',
                                },
                                label: {
                                    color: 'hsl(var(--foreground))',
                                },
                                button: {
                                    background: 'hsl(var(--primary))',
                                    color: 'hsl(var(--primary-foreground))',
                                }
                            }}
                        />
                    )}
                </div>
            </Card>

            {/* Uploaded Files List */}
            {proofs.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Uploaded Proofs ({proofs.length})</h3>
                    <div className="space-y-3">
                        {proofs.map((proof) => (
                            <Card key={proof.id} className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="p-2 rounded-lg bg-muted">
                                            {getFileIcon(proof.fileName)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium text-sm">{proof.fileName}</p>
                                                {getStatusBadge(proof.status)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Uploaded {format(new Date(proof.uploadDate), 'PPP')}
                                            </p>
                                            {proof.description && (
                                                <p className="text-sm mt-2">{proof.description}</p>
                                            )}
                                            {proof.status === 'APPROVED' && proof.reviewedAt && (
                                                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                                                    <p className="text-xs text-green-700 dark:text-green-400">
                                                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                                        Approved by {proof.reviewer?.name} on {format(new Date(proof.reviewedAt), 'PPP')}
                                                    </p>
                                                    {proof.reviewerComments && (
                                                        <p className="text-xs mt-1">{proof.reviewerComments}</p>
                                                    )}
                                                </div>
                                            )}
                                            {proof.status === 'REJECTED' && proof.reviewedAt && (
                                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                                                    <p className="text-xs text-red-700 dark:text-red-400">
                                                        <XCircle className="h-3 w-3 inline mr-1" />
                                                        Rejected by {proof.reviewer?.name} on {format(new Date(proof.reviewedAt), 'PPP')}
                                                    </p>
                                                    {proof.reviewerComments && (
                                                        <p className="text-xs mt-1 font-medium">Reason: {proof.reviewerComments}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={proof.filePath} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="outline" size="sm">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </a>
                                        {proof.status === 'PENDING' && (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDelete(proof.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Help Text */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                    <strong>Tips:</strong> Upload certificates, screenshots of completed modules, or any document that proves you completed the training. 
                    Your trainer will review and approve your submissions.
                </AlertDescription>
            </Alert>
        </div>
    )
}
