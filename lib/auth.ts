import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Nodemailer from 'next-auth/providers/nodemailer'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { sendVerificationRequest } from '@/lib/email'
import type { Adapter } from 'next-auth/adapters'

/**
 * NextAuth v5 Configuration
 * 
 * Implements passwordless email authentication with:
 * - Prisma adapter for user data persistence
 * - JWT session strategy (required for Credentials provider)
 * - Nodemailer provider for magic link emails
 * - Credentials provider for OTP authentication
 * - Role-based access control (RBAC)
 * - Custom session callbacks
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
    // Secret for encrypting tokens and CSRF protection
    secret: process.env.NEXTAUTH_SECRET,

    // Trust the host in production (needed for CSRF protection)
    trustHost: true,

    // Database adapter - cast to correct type
    adapter: PrismaAdapter(db) as Adapter,

    // Authentication providers
    providers: [
        Nodemailer({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
            sendVerificationRequest: sendVerificationRequest as any,
        }),
        Credentials({
            id: 'otp',
            name: 'OTP',
            credentials: {
                userId: { label: 'User ID', type: 'text' },
            },
            async authorize(credentials) {
                console.log('🔐 Credentials provider authorize called:', { userId: credentials?.userId })

                if (!credentials?.userId) {
                    console.log('❌ No userId provided')
                    return null
                }

                // Get user from database
                const user = await db.user.findUnique({
                    where: { id: credentials.userId as string },
                })

                console.log('👤 User lookup result:', { found: !!user, id: user?.id })

                if (user) {
                    console.log('✅ User authorized:', user.id)
                    return {
                        id: user.id,
                        email: user.email || '',
                        name: user.name || '',
                        systemRoles: user.systemRoles,
                        employeeNo: user.employeeNo || '',
                        department: user.department,
                        designation: user.designation,
                        location: user.location,
                    }
                }

                console.log('❌ User not found')
                return null
            },
        }),
    ],

    // Custom pages
    pages: {
        signIn: '/login',
        error: '/login',
    },

    // Callbacks
    callbacks: {
        /**
         * JWT callback - Add custom user fields to token
         * Called when token is created or updated
         */
        async jwt({ token, user, trigger }) {
            // On signin, add user data to token
            if (user) {
                token.id = user.id
                token.systemRoles = user.systemRoles
                token.employeeNo = user.employeeNo
                token.department = user.department
                token.designation = user.designation
                token.location = user.location
            }
            return token
        },

        /**
         * Session callback - Add custom fields from token to session
         * With JWT strategy, user data comes from token
         */
        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id as string
                session.user.systemRoles = token.systemRoles as string[]
                session.user.employeeNo = token.employeeNo as string
                session.user.department = token.department as string
                session.user.designation = token.designation as string
                session.user.location = token.location as string
            }
            return session
        },
    },

    // Session configuration - MUST use JWT with Credentials provider
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    // Enable debug messages in development
    debug: process.env.NODE_ENV === 'development',
})
