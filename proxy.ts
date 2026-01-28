import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Role-Based Access Control (RBAC) Proxy
 * 
 * Protects routes based on authentication and role requirements:
 * - /admin/* requires ADMIN role
 * - /training/* requires TRAINER or ADMIN role
 * - /manager/* requires MANAGER or ADMIN role
 * - All other app routes require authentication
 * 
 * Note: Renamed from middleware to proxy per Next.js 16 convention
 */
export default auth((req) => {
    const isLoggedIn = !!req.auth
    const userRoles = req.auth?.user?.systemRoles || []
    const { pathname } = req.nextUrl

    // Public routes - allow access
    if (
        pathname === '/login' ||
        pathname.startsWith('/api/auth') ||
        pathname === '/unauthorized'
    ) {
        return NextResponse.next()
    }

    // Redirect authenticated users from home page to role-specific dashboard
    if (pathname === '/' && isLoggedIn) {
        // Check roles in priority order
        if (userRoles.includes('ADMIN')) {
            return NextResponse.redirect(new URL('/admin', req.url))
        } else if (userRoles.includes('TRAINER')) {
            return NextResponse.redirect(new URL('/trainer', req.url))
        } else if (userRoles.includes('MANAGER')) {
            return NextResponse.redirect(new URL('/manager', req.url))
        } else {
            return NextResponse.redirect(new URL('/employee', req.url))
        }
    }

    // Require authentication for all protected routes
    if (!isLoggedIn) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Role-based access control
    const roleRoutes: Record<string, string[]> = {
        '/admin': ['ADMIN'],
        '/trainer': ['TRAINER', 'ADMIN'],
        '/manager': ['MANAGER', 'ADMIN'],
        '/employee': ['LEARNER', 'ADMIN', 'MANAGER', 'TRAINER', 'MENTOR', 'MENTOR'],
    }

    // Check if route requires specific role
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
        if (pathname.startsWith(route)) {
            const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role))
            if (!hasRequiredRole) {
                return NextResponse.redirect(new URL('/unauthorized', req.url))
            }
        }
    }

    return NextResponse.next()
})

/**
 * Matcher configuration
 * 
 * Apply middleware to all routes except:
 * - Static files (_next/static)
 * - Images (_next/image)
 * - Favicon
 * - Public folder assets
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
