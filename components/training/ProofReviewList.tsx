'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ProofReviewCard } from './ProofReviewCard'
import { FileText, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Proof {
    id: string
    fileName: string
    filePath: string
    description?: string | null
    status: string
    uploadDate: Date
    daysPending: number
    isOverdue: boolean
    assignment: {
        training: {
            topicName: string
            skill: {
                name: string
                category: {
                    colorClass: string | null
                } | null
            } | null
        }
        user: {
            id: string
            name: string
            department: string | null
        }
    }
}

interface ProofReviewListProps {
    proofs: Proof[]
}

export function ProofReviewList({ proofs }: ProofReviewListProps) {
    if (proofs.length === 0) {
        return (
            <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No pending proofs</p>
                    <p className="text-sm text-muted-foreground">
                        All proofs have been reviewed
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {proofs.map((proof) => {
                const initials = proof.assignment.user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                return (
                    <Card key={proof.id} className={proof.isOverdue ? 'border-orange-500 border-2' : ''}>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{proof.assignment.user.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{proof.assignment.training.topicName}</p>
                                        {proof.assignment.training.skill && (
                                            <Badge 
                                                variant="secondary" 
                                                className={`mt-2 ${proof.assignment.training.skill.category?.colorClass || ''}`}
                                            >
                                                {proof.assignment.training.skill.name}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>{proof.daysPending} days pending</span>
                                    </div>
                                    {proof.isOverdue && (
                                        <Badge variant="destructive" className="text-xs">
                                            Overdue Review
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ProofReviewCard proof={proof} />
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
