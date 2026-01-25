/**
 * Database Client Export
 * 
 * This file exports the Prisma database client for use throughout the application.
 * It implements a singleton pattern to prevent multiple Prisma Client instances
 * in development mode, which is important for Next.js hot reload compatibility.
 * 
 * Usage:
 * ```typescript
 * import { db } from '@/lib/db'
 * 
 * const users = await db.user.findMany()
 * ```
 */

export { prisma as db } from './prisma'
