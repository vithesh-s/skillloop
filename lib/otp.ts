import { db } from '@/lib/db'
import nodemailer from 'nodemailer'

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP via email
 */
export async function sendOTPEmail(email: string, code: string): Promise<boolean> {
    try {
        const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER!)

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Your Skill Loop OTP Code',
            html: `
        <h2>Skill Loop - One-Time Password</h2>
        <p>Your OTP code is:</p>
        <h1 style="font-size: 2em; letter-spacing: 0.1em; color: #16a34a;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 0.9em;">Do not share this code with anyone.</p>
      `,
            text: `Your Skill Loop OTP code is: ${code}. This code will expire in 10 minutes.`,
        })

        return true
    } catch (error) {
        console.error('Failed to send OTP email:', error)
        return false
    }
}

/**
 * Create and send OTP for an email address
 */
export async function createAndSendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
        // Clean up expired OTPs for this email
        await db.oTP.deleteMany({
            where: {
                email,
                expiresAt: { lt: new Date() },
            },
        })

        // Check for existing valid OTP (throttle)
        const existingOTP = await db.oTP.findFirst({
            where: {
                email,
                expiresAt: { gt: new Date() },
                used: false,
            },
        })

        if (existingOTP && existingOTP.createdAt.getTime() > Date.now() - 60000) {
            return {
                success: false,
                message: 'Please wait before requesting another OTP',
            }
        }

        // Generate new OTP
        const code = generateOTP()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Save OTP to database
        await db.oTP.create({
            data: {
                email,
                code,
                expiresAt,
            },
        })

        // Send OTP email
        const emailSent = await sendOTPEmail(email, code)

        if (!emailSent) {
            // Delete the OTP if email failed to send
            await db.oTP.delete({
                where: {
                    email_code: { email, code },
                },
            })
            return {
                success: false,
                message: 'Failed to send OTP. Please try again.',
            }
        }

        return {
            success: true,
            message: 'OTP sent to your email',
        }
    } catch (error) {
        console.error('Error creating OTP:', error)
        return {
            success: false,
            message: 'An error occurred. Please try again.',
        }
    }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
        const otp = await db.oTP.findFirst({
            where: {
                email,
                code,
                used: false,
                expiresAt: { gt: new Date() },
            },
        })

        if (!otp) {
            return {
                success: false,
                message: 'Invalid or expired OTP',
            }
        }

        // Check attempts
        if (otp.attempts >= otp.maxAttempts) {
            await db.oTP.delete({
                where: { id: otp.id },
            })
            return {
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.',
            }
        }

        // Mark OTP as used
        await db.oTP.update({
            where: { id: otp.id },
            data: {
                used: true,
                usedAt: new Date(),
            },
        })

        return {
            success: true,
            message: 'OTP verified successfully',
        }
    } catch (error) {
        console.error('Error verifying OTP:', error)
        return {
            success: false,
            message: 'An error occurred. Please try again.',
        }
    }
}

/**
 * Increment OTP attempts
 */
export async function incrementOTPAttempts(email: string, code: string): Promise<void> {
    try {
        const otp = await db.oTP.findFirst({
            where: {
                email,
                code,
                used: false,
            },
        })

        if (otp) {
            await db.oTP.update({
                where: { id: otp.id },
                data: {
                    attempts: otp.attempts + 1,
                },
            })
        }
    } catch (error) {
        console.error('Error incrementing OTP attempts:', error)
    }
}
