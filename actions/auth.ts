'use server'

import { auth, signIn, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Server Actions for Authentication
 * 
 * Provides server-side functions for auth operations:
 * - loginWithEmail: Send magic link to user's email
 * - logout: Sign out current user
 * - getCurrentUser: Get current session user
 * - checkAuthorization: Verify user has required role
 */

/**
 * Login with Email (Magic Link)
 * 
 * @param email - User's email address
 * @param callbackUrl - URL to redirect after successful login
 */
export async function loginWithEmail(email: string, callbackUrl?: string) {
    try {
        await signIn('nodemailer', {
            email,
            redirect: false,
            callbackUrl: callbackUrl || '/',
        })
        return { success: true }
    } catch (error) {
        console.error('Login error:', error)
        return {
            success: false,
            error: 'Failed to send magic link. Please try again.',
        }
    }
}

/**
 * Logout Current User
 * 
 * @param redirectTo - URL to redirect after logout (default: /login)
 */
export async function logout(redirectTo: string = '/login') {
    await signOut({ redirectTo })
}

/**
 * Get Current Session User
 * 
 * @returns Session user or null if not authenticated
 */
export async function getCurrentUser() {
    const session = await auth()
    return session?.user || null
}

/**
 * Check if current user has required role(s)
 * 
 * @param allowedRoles - Array of allowed roles (e.g., ['ADMIN', 'TRAINER'])
 * @returns Object with authorized status and user
 */
export async function checkAuthorization(allowedRoles: string[]) {
    const session = await auth()
    const user = session?.user

    if (!user) {
        return { authorized: false, user: null }
    }

    const authorized = allowedRoles.some(role => user.systemRoles.includes(role))
    return { authorized, user }
}

/**
 * Require Authentication
 * 
 * Redirects to login if not authenticated
 * Use in Server Components
 */
export async function requireAuth() {
    const session = await auth()
    if (!session?.user) {
        redirect('/login')
    }
    return session
}

/**
 * Require Role
 * 
 * Redirects to unauthorized if user doesn't have required role
 * Use in Server Components
 * 
 * @param allowedRoles - Array of allowed roles
 */
export async function requireRole(allowedRoles: string[]) {
    const session = await requireAuth()

    if (!allowedRoles.some(role => session.user.systemRoles.includes(role))) {
        redirect('/unauthorized')
    }

    return session
}
