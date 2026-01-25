"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RiAlertLine } from "@remixicon/react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <RiAlertLine className="h-6 w-6" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An error occurred while loading the assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <div className="flex gap-2">
            <Button onClick={reset} variant="outline" className="flex-1">
              Try again
            </Button>
            <Link href="/employee/assessments" className="flex-1">
              <Button className="w-full">Back to Assessments</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
