import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const f = createUploadthing()

// FileRouter for proof of completion uploads
export const ourFileRouter = {
  // Proof uploader for training completion documents
  proofUploader: f({
    pdf: { maxFileSize: '8MB', maxFileCount: 3 },
    image: { maxFileSize: '8MB', maxFileCount: 3 },
    'application/msword': { maxFileSize: '8MB', maxFileCount: 3 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxFileSize: '8MB', maxFileCount: 3 }
  })
    .middleware(async ({ req, files }) => {
      // Check authentication
      const session = await auth()
      if (!session?.user) {
        throw new UploadThingError('Unauthorized - You must be logged in to upload')
      }

      // Get assignmentId from request metadata
      // The client passes this through the UploadThing component
      const metadata = (req as any).body?.metadata
      const assignmentId = metadata?.assignmentId
      
      if (!assignmentId) {
        throw new UploadThingError('Assignment ID is required')
      }

      // Verify the training assignment exists and belongs to the user
      const assignment = await prisma.trainingAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          training: {
            select: { topicName: true }
          }
        }
      })

      if (!assignment) {
        throw new UploadThingError('Training assignment not found')
      }

      // Only the assigned user or admin can upload
      const roles = session.user.systemRoles || []
      if (assignment.userId !== session.user.id && !roles.includes('ADMIN')) {
        throw new UploadThingError('You are not authorized to upload for this training')
      }

      // Return metadata for onUploadComplete
      return {
        userId: session.user.id,
        assignmentId: assignmentId,
        trainingName: assignment.training.topicName
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Create ProofOfCompletion record in database
      try {
        const proof = await prisma.proofOfCompletion.create({
          data: {
            assignmentId: metadata.assignmentId,
            fileName: file.name,
            filePath: file.url, // UploadThing CDN URL
            status: 'PENDING'
          }
        })

        console.log('✅ Proof uploaded:', {
          file: file.name,
          assignment: metadata.assignmentId,
          user: metadata.userId,
          training: metadata.trainingName
        })

        // TODO: Send notification to mentor/trainer for review

        return { 
          success: true, 
          proofId: proof.id,
          fileUrl: file.url 
        }
      } catch (error) {
        console.error('Failed to create proof record:', error)
        throw new UploadThingError('Failed to save proof record to database')
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
