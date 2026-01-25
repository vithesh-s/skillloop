import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Auth Utility Functions
 * 
 * Helper functions for common authentication operations
 */

/**
 * Check if user has any of the specified roles
 * 
 * @param userRole - User's current role
 * @param allowedRoles - Array of allowed roles
 * @returns true if user has required role
 */
export function hasRole(userRole: string | undefined, allowedRoles: string[]): boolean {
    if (!userRole) return false
    return allowedRoles.includes(userRole)
}

/**
 * Check if user is admin
 * 
 * @param userRole - User's current role
 * @returns true if user is ADMIN
 */
export function isAdmin(userRole: string | undefined): boolean {
    return userRole === 'ADMIN'
}

/**
 * Check if user is trainer (or admin)
 * 
 * @param userRole - User's current role
 * @returns true if user is TRAINER or ADMIN
 */
export function isTrainer(userRole: string | undefined): boolean {
    return hasRole(userRole, ['TRAINER', 'ADMIN'])
}

/**
 * Check if user is manager (or admin)
 * 
 * @param userRole - User's current role
 * @returns true if user is MANAGER or ADMIN
 */
export function isManager(userRole: string | undefined): boolean {
    return hasRole(userRole, ['MANAGER', 'ADMIN'])
}

/**
 * Get role display name
 * 
 * @param role - User role enum value
 * @returns Human-readable role name
 */
export function getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
        ADMIN: 'Administrator',
        TRAINER: 'Trainer',
        MANAGER: 'Manager',
        EMPLOYEE: 'Employee',
    }
    return roleNames[role] || role
}

/**
 * Get role badge color
 * 
 * @param role - User role enum value
 * @returns Tailwind color class for badge
 */
export function getRoleBadgeColor(role: string): string {
    const colors: Record<string, string> = {
        ADMIN: 'bg-red-100 text-red-800',
        TRAINER: 'bg-blue-100 text-blue-800',
        MANAGER: 'bg-purple-100 text-purple-800',
        EMPLOYEE: 'bg-emerald-100 text-emerald-800',
    }
    return colors[role] || 'bg-slate-100 text-slate-800'
}

/**
 * Get user initials from name
 * 
 * @param name - User's full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getUserInitials(name: string | undefined | null): string {
    if (!name) return '?'

    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
}

/**
 * Server-side: Get session or redirect to login
 * Use in Server Components and Server Actions
 */
export async function getSessionOrRedirect() {
    const session = await auth()
    if (!session?.user) {
        redirect('/login')
    }
    return session
}

/**
 * Server-side: Get session with role check or redirect
 * Use in Server Components and Server Actions
 * 
 * @param allowedRoles - Array of allowed roles
 */
export async function getSessionWithRole(allowedRoles: string[]) {
    const session = await getSessionOrRedirect()

    if (!hasRole(session.user.role, allowedRoles)) {
        redirect('/unauthorized')
    }

    return session
}
