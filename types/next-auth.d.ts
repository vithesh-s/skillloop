import { DefaultSession } from 'next-auth'

/**
 * NextAuth Type Augmentation
 * 
 * Extends the default NextAuth types to include custom user fields
 */
declare module 'next-auth' {
    /**
     * Extended Session with custom user fields
     */
    interface Session {
        user: {
            id: string
            systemRoles: string[]
            employeeNo: string
            department: string | null
            designation: string | null
            location: string | null
        } & DefaultSession['user']
    }

    /**
     * Extended User with custom fields
     */
    interface User {
        systemRoles: string[]
        employeeNo: string
        department: string | null
        designation: string | null
        location: string | null
    }
}

/**
 * JWT Token type augmentation
 * (Not used with database sessions, but included for completeness)
 */
declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: string
        employeeNo: string
        department: string | null
        designation: string | null
        location: string | null
    }
}

export { }
