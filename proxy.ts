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
    const userRole = req.auth?.user?.role
    const { pathname } = req.nextUrl

    // Public routes - allow access
    if (
        pathname === '/login' ||
        pathname.startsWith('/api/auth') ||
        pathname === '/unauthorized'
    ) {
        return NextResponse.next()
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
        '/training': ['TRAINER', 'ADMIN'],
        '/manager': ['MANAGER', 'ADMIN'],
    }

    // Check if route requires specific role
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
        if (pathname.startsWith(route)) {
            if (!userRole || !allowedRoles.includes(userRole)) {
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
