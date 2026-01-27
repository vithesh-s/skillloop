'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { proofSubmissionSchema, proofReviewSchema, type ProofSubmissionInput, type ProofReviewInput } from '@/lib/validation'

/**
 * Submit proof of completion for a training assignment
 * Note: The actual file upload is handled by UploadThing
 * This action is called AFTER the file is uploaded
 */
export async function submitProof(data: ProofSubmissionInput) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    try {
        // Validate input
        const validated = proofSubmissionSchema.parse(data)

        // Verify assignment exists and belongs to user
        const assignment = await prisma.trainingAssignment.findUnique({
            where: { id: validated.assignmentId },
            include: {
                training: {
                    select: {
                        topicName: true
                    }
                },
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                mentor: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            }
        })

        if (!assignment) {
            return { success: false, error: 'Training assignment not found' }
        }

        if (assignment.userId !== session.user.id) {
            return { success: false, error: 'You are not authorized to submit proof for this training' }
        }

        // Create proof record (typically already created by UploadThing onUploadComplete)
        // This can be used as a fallback or for additional metadata
        const proof = await prisma.proofOfCompletion.create({
            data: {
                assignmentId: validated.assignmentId,
                fileName: validated.fileName,
                filePath: validated.filePath,
                status: 'PENDING',
                description: validated.description
            }
        })

        // Notify trainer/mentor
        const notificationRecipients = []
        if (assignment.trainerId) notificationRecipients.push(assignment.trainerId)
        if (assignment.mentorId && assignment.mentorId !== assignment.trainerId) {
            notificationRecipients.push(assignment.mentorId)
        }

        for (const recipientId of notificationRecipients) {
            await prisma.notification.create({
                data: {
                    recipientId,
                    type: 'TRAINING_PROOF_SUBMITTED',
                    subject: 'Proof of Completion Submitted',
                    message: `${session.user.name} has submitted proof of completion for ${assignment.training.topicName}. Please review.`
                }
            })
        }

        revalidatePath('/employee/training/[id]/progress', 'page')
        revalidatePath('/trainer/review-progress')

        return { success: true, data: proof }
    } catch (error) {
        console.error('Submit proof error:', error)
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Failed to submit proof' }
    }
}

/**
 * Get all proofs for a training assignment
 */
export async function getProofsForAssignment(assignmentId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    try {
        // Verify authorization
        const assignment = await prisma.trainingAssignment.findUnique({
            where: { id: assignmentId },
            select: {
                userId: true,
                trainerId: true,
                mentorId: true
            }
        })

        if (!assignment) {
            return { success: false, error: 'Assignment not found' }
        }

        const roles = session.user.systemRoles || []
        const isAuthorized =
            assignment.userId === session.user.id ||
            assignment.trainerId === session.user.id ||
            assignment.mentorId === session.user.id ||
            roles.includes('ADMIN')

        if (!isAuthorized) {
            return { success: false, error: 'Unauthorized' }
        }

        const proofs = await prisma.proofOfCompletion.findMany({
            where: { assignmentId },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { uploadDate: 'desc' }
        })

        return { success: true, data: proofs }
    } catch (error) {
        console.error('Get proofs error:', error)
        return { success: false, error: 'Failed to fetch proofs' }
    }
}

/**
 * Get pending proofs for review (for trainer/mentor dashboard)
 */
export async function getPendingProofsForReview(reviewerId?: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    const effectiveReviewerId = reviewerId || session.user.id
    const roles = session.user.systemRoles || []

    try {
        let proofs

        if (roles.includes('ADMIN')) {
            // Admins see all pending proofs
            proofs = await prisma.proofOfCompletion.findMany({
                where: { status: 'PENDING' },
                include: {
                    assignment: {
                        include: {
                            training: {
                                select: {
                                    topicName: true,
                                    skill: {
                                        select: {
                                            name: true,
                                            category: {
                                                select: {
                                                    colorClass: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    department: true
                                }
                            }
                        }
                    }
                },
                orderBy: { uploadDate: 'asc' }
            })
        } else {
            // Trainers/Mentors see proofs for their assignments only
            proofs = await prisma.proofOfCompletion.findMany({
                where: {
                    status: 'PENDING',
                    assignment: {
                        OR: [
                            { trainerId: effectiveReviewerId },
                            { mentorId: effectiveReviewerId }
                        ]
                    }
                },
                include: {
                    assignment: {
                        include: {
                            training: {
                                select: {
                                    topicName: true,
                                    skill: {
                                        select: {
                                            name: true,
                                            category: {
                                                select: {
                                                    colorClass: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    department: true
                                }
                            }
                        }
                    }
                },
                orderBy: { uploadDate: 'asc' }
            })
        }

        // Calculate days pending for each proof
        const enriched = proofs.map(proof => ({
            ...proof,
            daysPending: Math.floor((new Date().getTime() - proof.uploadDate.getTime()) / (1000 * 60 * 60 * 24)),
            isOverdue: Math.floor((new Date().getTime() - proof.uploadDate.getTime()) / (1000 * 60 * 60 * 24)) > 3
        }))

        return { success: true, data: enriched }
    } catch (error) {
        console.error('Get pending proofs error:', error)
        return { success: false, error: 'Failed to fetch pending proofs' }
    }
}

/**
 * Review proof of completion (approve or reject)
 */
export async function reviewProof(data: ProofReviewInput) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    try {
        // Validate input
        const validated = proofReviewSchema.parse(data)

        // Fetch proof with assignment details
        const proof = await prisma.proofOfCompletion.findUnique({
            where: { id: validated.proofId },
            include: {
                assignment: {
                    include: {
                        training: {
                            select: {
                                topicName: true,
                                skillId: true
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        if (!proof) {
            return { success: false, error: 'Proof not found' }
        }

        // Verify reviewer is authorized
        const roles = session.user.systemRoles || []
        const isAuthorized =
            proof.assignment.trainerId === session.user.id ||
            proof.assignment.mentorId === session.user.id ||
            roles.includes('ADMIN')

        if (!isAuthorized) {
            return { success: false, error: 'You are not authorized to review this proof' }
        }

        if (proof.status !== 'PENDING') {
            return { success: false, error: 'This proof has already been reviewed' }
        }

        // Update proof status
        const updatedProof = await prisma.proofOfCompletion.update({
            where: { id: validated.proofId },
            data: {
                status: validated.status,
                reviewerId: session.user.id,
                reviewedAt: new Date(),
                reviewerComments: validated.reviewerComments
            }
        })

        // If approved, mark training as completed and update skill matrix
        if (validated.status === 'APPROVED') {
            // Update training assignment status
            await prisma.trainingAssignment.update({
                where: { id: proof.assignmentId },
                data: {
                    status: 'COMPLETED',
                    completionDate: new Date()
                }
            })

            // Update skill matrix if skill is linked
            if (proof.assignment.training.skillId) {
                const skillMatrixEntry = await prisma.skillMatrix.findUnique({
                    where: {
                        userId_skillId: {
                            userId: proof.assignment.userId,
                            skillId: proof.assignment.training.skillId
                        }
                    }
                })

                if (skillMatrixEntry) {
                    // Update currentLevel to desiredLevel and mark as completed
                    await prisma.skillMatrix.update({
                        where: {
                            userId_skillId: {
                                userId: proof.assignment.userId,
                                skillId: proof.assignment.training.skillId
                            }
                        },
                        data: {
                            currentLevel: skillMatrixEntry.desiredLevel,
                            gapPercentage: 0,
                            status: 'completed',
                            lastAssessedDate: new Date()
                        }
                    })
                }
            }

            // Notify user of approval
            await prisma.notification.create({
                data: {
                    recipientId: proof.assignment.userId,
                    type: 'TRAINING_COMPLETED',
                    subject: 'Training Completed - Proof Approved',
                    message: `Congratulations! Your proof for ${proof.assignment.training.topicName} has been approved. Training marked as completed.`
                }
            })
        } else {
            // Notify user of rejection
            await prisma.notification.create({
                data: {
                    recipientId: proof.assignment.userId,
                    type: 'TRAINING_PROOF_REJECTED',
                    subject: 'Proof of Completion Rejected',
                    message: `Your proof for ${proof.assignment.training.topicName} has been rejected. ${validated.reviewerComments ? `Reason: ${validated.reviewerComments}` : 'Please submit a new proof.'}`
                }
            })
        }

        revalidatePath('/employee/training/[id]/progress', 'page')
        revalidatePath('/trainer/review-progress')
        revalidatePath('/employee/my-trainings')

        return { success: true, data: updatedProof }
    } catch (error) {
        console.error('Review proof error:', error)
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Failed to review proof' }
    }
}

/**
 * Delete a proof (only if status is PENDING and user is the owner)
 */
export async function deleteProof(proofId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    try {
        const proof = await prisma.proofOfCompletion.findUnique({
            where: { id: proofId },
            include: {
                assignment: {
                    select: {
                        userId: true
                    }
                }
            }
        })

        if (!proof) {
            return { success: false, error: 'Proof not found' }
        }

        // Only the owner can delete, and only if PENDING
        if (proof.assignment.userId !== session.user.id) {
            return { success: false, error: 'You can only delete your own proofs' }
        }

        if (proof.status !== 'PENDING') {
            return { success: false, error: 'You can only delete pending proofs' }
        }

        await prisma.proofOfCompletion.delete({
            where: { id: proofId }
        })

        // TODO: Delete file from UploadThing CDN

        revalidatePath('/employee/training/[id]/progress', 'page')

        return { success: true }
    } catch (error) {
        console.error('Delete proof error:', error)
        return { success: false, error: 'Failed to delete proof' }
    }
}
