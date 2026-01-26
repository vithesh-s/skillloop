import { generateReactHelpers, generateUploadButton, generateUploadDropzone } from '@uploadthing/react'
import type { OurFileRouter } from '@/app/api/uploadthing/core'

// Generate typed helpers for client components
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>()

// Generate pre-built components
export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()
