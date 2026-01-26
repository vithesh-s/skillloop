import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from './core'

// Export routes for Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    logLevel: process.env.NODE_ENV === 'development' ? 'Debug' : 'Error',
    callbackUrl: process.env.UPLOADTHING_CALLBACK_URL
  }
})
