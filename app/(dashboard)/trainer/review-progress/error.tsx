'use client'

import { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Review progress error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-150 p-6">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-6 w-6" />
                        <CardTitle>Error Loading Reviews</CardTitle>
                    </div>
                    <CardDescription>
                        We couldn't load the progress reviews
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {error.message || 'An unexpected error occurred while fetching review data'}
                        </AlertDescription>
                    </Alert>

                    <div className="flex flex-col gap-2">
                        <Button onClick={reset} className="w-full">
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        <Link href="/trainer" className="w-full">
                            <Button variant="outline" className="w-full">
                                <Home className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>

                    {error.digest && (
                        <p className="text-xs text-muted-foreground text-center">
                            Error ID: {error.digest}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
