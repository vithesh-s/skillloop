'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { OTPInput } from '@/components/ui/otp-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RiMailLine, RiCheckLine, RiErrorWarningLine, RiLockLine } from '@remixicon/react'

/**
 * Login Page
 * 
 * Passwordless authentication with two methods:
 * 1. Magic Link - Email-based authentication
 * 2. OTP - One-time password sent via email
 */
export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authMethod, setAuthMethod] = useState<'magic' | 'otp'>('magic')
  const [otpSent, setOtpSent] = useState(false)

  // Handle errors from URL params
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
  }, [searchParams])

  // Magic Link Authentication
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn('nodemailer', {
        email,
        redirect: false,
        callbackUrl: '/',
      })

      if (result?.ok) {
        setSent(true)
      } else if (result?.error) {
        setError(getErrorMessage(result.error))
      } else {
        setError('Failed to send magic link. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // OTP Authentication - Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'send' }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
      } else {
        setError(data.message || 'Failed to send OTP')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // OTP Authentication - Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔐 Starting OTP verification:', { email, otp })

      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, action: 'verify' }),
      })

      console.log('📡 OTP API response status:', response.status)

      const data = await response.json()
      console.log('📦 OTP API response data:', data)

      if (response.ok && data.success) {
        console.log('✅ OTP verified, calling signIn with userId:', data.userId)

        // OTP verified, now sign in with NextAuth
        try {
          // Add timeout to prevent indefinite hanging
          const signInPromise = signIn('otp', {
            userId: data.userId,
            redirect: false
          })

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SignIn timeout after 10 seconds')), 10000)
          )

          const result = await Promise.race([signInPromise, timeoutPromise]) as any

          console.log('🔑 SignIn result:', JSON.stringify(result, null, 2))

          if (result?.ok) {
            console.log('✅ SignIn successful, redirecting...')
            // Successfully signed in, wait for session to be established then redirect
            await new Promise(resolve => setTimeout(resolve, 500))
            window.location.href = '/'
          } else if (result?.error) {
            console.error('❌ SignIn error:', result.error)
            setError(`Authentication failed: ${result.error}`)
            setLoading(false)
          } else {
            console.error('❌ SignIn failed with result:', result)
            setError('Failed to create session. Please try again.')
            setLoading(false)
          }
        } catch (signInError) {
          console.error('❌ SignIn exception:', signInError)
          setError(`SignIn error: ${signInError instanceof Error ? signInError.message : 'Unknown error'}`)
          setLoading(false)
        }
      } else {
        console.error('❌ OTP verification failed:', data)
        setError(data.message || 'Invalid OTP')
        setLoading(false)
      }
    } catch (err) {
      console.error('❌ Verification error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">SL</span>
          </div>
          <CardTitle className="text-2xl font-bold">Skill Loop</CardTitle>
        </div>
        <CardDescription>
          Choose your preferred authentication method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="magic" className="w-full" onValueChange={(v) => setAuthMethod(v as 'magic' | 'otp')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="magic">
              <RiMailLine className="mr-2 h-4 w-4" />
              Magic Link
            </TabsTrigger>
            <TabsTrigger value="otp">
              <RiLockLine className="mr-2 h-4 w-4" />
              OTP Code
            </TabsTrigger>
          </TabsList>

          {/* Magic Link Tab */}
          <TabsContent value="magic" className="space-y-4">
            {sent ? (
              <div className="space-y-4">
                <Alert className="border-emerald-200 bg-emerald-50">
                  <RiCheckLine className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700">
                    Magic link sent to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>Check your inbox and click the link to sign in.</p>
                  <p className="text-xs text-slate-500">
                    The link expires in 24 hours. Check spam if you don't see it.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSent(false)
                    setEmail('')
                  }}
                  className="w-full"
                >
                  Send another link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                {error && authMethod === 'magic' && (
                  <Alert variant="destructive">
                    <RiErrorWarningLine className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email-magic">Email</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    placeholder="your.email@acemicromatic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RiMailLine className="mr-2 h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  A secure login link will be sent to your email
                </p>
              </form>
            )}
          </TabsContent>

          {/* OTP Tab */}
          <TabsContent value="otp" className="space-y-4">
            {otpSent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleVerifyOTP()
                }}
                className="space-y-4"
              >
                {error && authMethod === 'otp' && (
                  <Alert variant="destructive">
                    <RiErrorWarningLine className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert className="border-blue-200 bg-blue-50">
                  <RiCheckLine className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    6-digit code sent to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 items-center justify-center">
                  <Label htmlFor="otp">Enter OTP Code</Label>
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                    length={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <RiCheckLine className="mr-2 h-4 w-4" />
                      Verify OTP
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOtpSent(false)
                    setOtp('')
                    setEmail('')
                  }}
                  disabled={loading}
                >
                  Use different email
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Code expires in 10 minutes
                </p>
              </form>
            ) : (
              <form onSubmit={handleSendOTP} className="space-y-4">
                {error && authMethod === 'otp' && (
                  <Alert variant="destructive">
                    <RiErrorWarningLine className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email-otp">Email</Label>
                  <Input
                    id="email-otp"
                    type="email"
                    placeholder="your.email@acemicromatic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RiLockLine className="mr-2 h-4 w-4" />
                      Send OTP Code
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  We'll send a 6-digit code to your email
                </p>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/**
 * Get user-friendly error message from error code
 */
function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'Access denied. You do not have permission to sign in.',
    Verification: 'The verification link is invalid or has expired.',
    OAuthSignin: 'Error in constructing an authorization URL.',
    OAuthCallback: 'Error in handling the response from the OAuth provider.',
    OAuthCreateAccount: 'Could not create OAuth provider user in the database.',
    EmailCreateAccount: 'Could not create email provider user in the database.',
    Callback: 'Error in the OAuth callback handler route.',
    OAuthAccountNotLinked: 'Email already associated with another account.',
    EmailSignin: 'Sending the email with the verification link failed.',
    CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
    SessionRequired: 'Please sign in to access this page.',
  }

  return messages[error] || 'An error occurred during authentication.'
}
