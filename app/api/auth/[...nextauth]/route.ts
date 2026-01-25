import { handlers } from '@/lib/auth'

/**
 * NextAuth API Route Handler
 * 
 * Handles all NextAuth.js routes:
 * - GET /api/auth/signin - Sign in page
 * - POST /api/auth/signin/:provider - Initiate sign in
 * - GET /api/auth/callback/:provider - OAuth callback
 * - POST /api/auth/signout - Sign out
 * - GET /api/auth/session - Get session
 * - GET /api/auth/csrf - Get CSRF token
 * - GET /api/auth/providers - List providers
 */
export const { GET, POST } = handlers
