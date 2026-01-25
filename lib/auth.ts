import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Nodemailer from 'next-auth/providers/nodemailer'
import { db } from '@/lib/db'
import { sendVerificationRequest } from '@/lib/email'
import type { Adapter } from 'next-auth/adapters'

/**
 * NextAuth v5 Configuration
 * 
 * Implements passwordless email authentication with:
 * - Prisma adapter for database sessions
 * - Nodemailer provider for magic link emails
 * - Role-based access control (RBAC)
 * - Custom session callbacks
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
    // Database adapter - cast to correct type
    adapter: PrismaAdapter(db) as Adapter,

    // Authentication providers
    providers: [
        Nodemailer({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
            sendVerificationRequest: sendVerificationRequest as any,
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
         * Session callback - Add custom user fields to session
         * With database strategy, user comes from database
         */
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id
                session.user.role = user.role
                session.user.employeeNo = user.employeeNo
                session.user.department = user.department
                session.user.designation = user.designation
                session.user.location = user.location
            }
            return session
        },
    },

    // Session configuration (database strategy is default with adapter)
    // No need to explicitly set session.strategy = "database"

    // Enable debug messages in development
    debug: process.env.NODE_ENV === 'development',
})
