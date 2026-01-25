'use client'

import { useSession as useNextAuthSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

/**
 * Custom Session Hook
 * 
 * Wrapper around next-auth useSession with typed return values
 * Use in Client Components
 */
export function useSession() {
    const { data: session, status, update } = useNextAuthSession()

    return {
        session,
        user: session?.user,
        status,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
        isUnauthenticated: status === 'unauthenticated',
        update,
    }
}

/**
 * Require Authentication Hook
 * 
 * Redirects to login if not authenticated
 * Use in Client Components that require auth
 */
export function useRequireAuth() {
    const router = useRouter()
    const { user, status, isLoading } = useSession()

    if (!isLoading && !user) {
        router.push('/login')
    }

    return { user, isLoading }
}

/**
 * Require Role Hook
 * 
 * Redirects to unauthorized if user doesn't have required role
 * Use in Client Components that require specific role
 * 
 * @param allowedRoles - Array of allowed roles
 */
export function useRequireRole(allowedRoles: string[]) {
    const router = useRouter()
    const { user, isLoading } = useRequireAuth()

    if (!isLoading && user && !allowedRoles.some(role => user.systemRoles.includes(role))) {
        router.push('/unauthorized')
    }

    return { user, isLoading }
}

/**
 * Check if user has role
 * 
 * @param allowedRoles - Array of allowed roles
 * @returns true if user has one of the allowed roles
 */
export function useHasRole(allowedRoles: string[]): boolean {
    const { user } = useSession()
    if (!user) return false
    return allowedRoles.some(role => user.systemRoles.includes(role))
}

/**
 * Check if user is admin
 */
export function useIsAdmin(): boolean {
    return useHasRole(['ADMIN'])
}

/**
 * Check if user is trainer
 */
export function useIsTrainer(): boolean {
    return useHasRole(['TRAINER', 'ADMIN'])
}

/**
 * Check if user is manager
 */
export function useIsManager(): boolean {
    return useHasRole(['MANAGER', 'ADMIN'])
}
