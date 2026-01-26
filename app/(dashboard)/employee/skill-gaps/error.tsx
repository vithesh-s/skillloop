'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RiAlertLine, RiRefreshLine, RiHomeLine } from '@remixicon/react'
import Link from 'next/link'

export default function SkillGapsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Skill gaps page error:', error)
  }, [error])

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto mt-12">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-destructive/10 p-3">
              <RiAlertLine className="h-10 w-10 text-destructive" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Something Went Wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We encountered an error while loading your skill gaps. This might be a temporary issue.
          </p>

          {error.message && (
            <div className="bg-muted p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
              <p className="text-sm font-mono text-muted-foreground">{error.message}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={reset}>
              <RiRefreshLine className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/employee">
                <RiHomeLine className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground mt-6">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
