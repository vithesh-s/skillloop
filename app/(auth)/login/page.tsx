'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { RiMailLine, RiCheckLine, RiErrorWarningLine } from '@remixicon/react'

/**
 * Login Page
 * 
 * Passwordless email authentication with magic link
 * - User enters email
 * - System sends magic link to email
 * - User clicks link to authenticate
 */
export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle errors from URL params
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signin/nodemailer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          callbackUrl: '/',
        }),
      })

      if (response.ok) {
        setSent(true)
      } else {
        setError('Failed to send magic link. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">SL</span>
          </div>
          <CardTitle className="text-2xl font-bold">Skill Loop</CardTitle>
        </div>
        <CardDescription>
          {sent
            ? 'Check your email for the login link'
            : 'Enter your work email to sign in'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <Alert className="border-emerald-200 bg-emerald-50">
              <RiCheckLine className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">
                A magic link has been sent to <strong>{email}</strong>
              </AlertDescription>
            </Alert>
            <div className="text-sm text-slate-600 space-y-2">
              <p>Please check your inbox and click the link to sign in.</p>
              <p className="text-xs text-slate-500">
                The link will expire in 24 hours. If you don't see the email,
                check your spam folder.
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <RiErrorWarningLine className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
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
                  Sending magic link...
                </>
              ) : (
                <>
                  <RiMailLine className="mr-2 h-4 w-4" />
                  Send magic link
                </>
              )}
            </Button>

            <div className="text-xs text-slate-500 text-center">
              A secure login link will be sent to your email
            </div>
          </form>
        )}
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
