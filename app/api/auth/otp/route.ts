import { createAndSendOTP, verifyOTP, incrementOTPAttempts } from '@/lib/otp'
import { db } from '@/lib/db'
import { signIn } from 'next-auth/react'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/otp
 * Send or verify OTP
 */
export async function POST(req: NextRequest) {
    try {
        // Read body once
        const body = await req.json()
        const { email, action, code } = body

        console.log('📧 OTP API received:', { email, action, codeLength: code?.length })

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        if (action === 'send') {
            const result = await createAndSendOTP(email)
            return NextResponse.json(result)
        }

        if (action === 'verify') {
            if (!code) {
                return NextResponse.json(
                    { error: 'OTP code is required' },
                    { status: 400 }
                )
            }

            console.log('🔍 Verifying OTP...')
            // Verify OTP
            const result = await verifyOTP(email, code)
            console.log('✅ OTP verification result:', result)

            if (!result.success) {
                // Increment attempts on failure
                await incrementOTPAttempts(email, code)
                return NextResponse.json(result, { status: 400 })
            }

            // Check if user exists, if not create one
            let user = await db.user.findUnique({
                where: { email },
            })

            console.log('👤 User found:', user?.id)

            if (!user) {
                // Create a new user with minimal info
                user = await db.user.create({
                    data: {
                        email,
                        name: email.split('@')[0],
                        employeeNo: `EMP-${Date.now()}`,
                        designation: 'Employee',
                        department: 'General',
                        location: 'Default',
                        level: 1,
                        emailVerified: new Date(),
                    },
                })
                console.log('✅ New user created:', user.id)
            } else if (!user.emailVerified) {
                // Mark email as verified if it wasn't
                await db.user.update({
                    where: { id: user.id },
                    data: { emailVerified: new Date() },
                })
                console.log('✅ User email verified')
            }

            // Return userId for client-side signin
            console.log('📤 Returning success response with userId:', user.id)
            return NextResponse.json({
                success: true,
                message: 'OTP verified successfully',
                userId: user.id,
            })
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        )
    } catch (error) {
        console.error('OTP API error:', error)
        return NextResponse.json(
            { error: 'An error occurred' },
            { status: 500 }
        )
    }
}
