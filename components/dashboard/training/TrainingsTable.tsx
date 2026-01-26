'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RiSearchLine, RiEyeLine, RiDeleteBin6Line } from '@remixicon/react'
import Link from 'next/link'
import { deleteTraining } from '@/actions/trainings'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TrainingsTableProps {
    trainings: any[]
}

export function TrainingsTable({ trainings }: TrainingsTableProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    const filteredTrainings = trainings.filter(t =>
        t.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.skill?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete training "${name}"?`)) return
        
        const result = await deleteTraining(id)
        if (result.success) {
            toast.success('Training deleted')
            router.refresh()
        } else {
            toast.error(result.error || 'Failed to delete')
        }
    }

    return (
        <Card>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search trainings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Topic Name</TableHead>
                                <TableHead>Skill</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Assigned Users</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTrainings.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No trainings found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredTrainings.map((training) => (
                                <TableRow key={training.id}>
                                    <TableCell className="font-medium">{training.topicName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{training.skill?.name}</span>
                                            <span className="text-xs text-muted-foreground">{training.skill?.category?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={training.mode === 'ONLINE' ? 'default' : 'secondary'}>
                                            {training.mode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{training.duration}h</TableCell>
                                    <TableCell>{training._count?.assignments || 0}</TableCell>
                                    <TableCell className="text-sm">{training.creator?.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" asChild>
                                                <Link href={`/admin/training/${training.id}`}>
                                                    <RiEyeLine className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-destructive hover:text-destructive/90"
                                                onClick={() => handleDelete(training.id, training.topicName)}
                                            >
                                                <RiDeleteBin6Line className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
