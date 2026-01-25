import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Auth Utility Functions
 * 
 * Helper functions for common authentication operations
 */

/**
 * Check if user has any of the specified roles in their systemRoles array
 * 
 * @param userRoles - User's systemRoles array
 * @param allowedRoles - Array of allowed roles
 * @returns true if user has at least one required role
 */
export function hasRole(userRoles: string[] | undefined, allowedRoles: string[]): boolean {
    if (!userRoles || userRoles.length === 0) return false
    return allowedRoles.some(role => userRoles.includes(role))
}

/**
 * Check if user is admin
 * 
 * @param userRoles - User's systemRoles array
 * @returns true if user has ADMIN role
 */
export function isAdmin(userRoles: string[] | undefined): boolean {
    return hasRole(userRoles, ['ADMIN'])
}

/**
 * Check if user is trainer (or admin)
 * 
 * @param userRoles - User's systemRoles array
 * @returns true if user has TRAINER or ADMIN role
 */
export function isTrainer(userRoles: string[] | undefined): boolean {
    return hasRole(userRoles, ['TRAINER', 'ADMIN'])
}

/**
 * Check if user is manager (or admin)
 * 
 * @param userRoles - User's systemRoles array
 * @returns true if user has MANAGER or ADMIN role
 */
export function isManager(userRoles: string[] | undefined): boolean {
    return hasRole(userRoles, ['MANAGER', 'ADMIN'])
}

/**
 * Check if user can assign roles (admin or manager)
 * 
 * @param userRoles - User's systemRoles array
 * @returns true if user has ADMIN or MANAGER role
 */
export function canAssignRoles(userRoles: string[] | undefined): boolean {
    return hasRole(userRoles, ['ADMIN', 'MANAGER'])
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

    if (!hasRole(session.user.systemRoles, allowedRoles)) {
        redirect('/unauthorized')
    }

    return session
}
