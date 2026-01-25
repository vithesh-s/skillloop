import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPendingGrading } from "@/actions/assessments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PendingGradingTable } from "@/components/dashboard/trainer/PendingGradingTable"

export default async function TrainerGradingPage() {
  const session = await auth()
  if (!session?.user || !session.user.systemRoles?.includes("TRAINER")) {
    redirect("/unauthorized")
  }

  const result = await getPendingGrading()
  const attempts = result.attempts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Grading</h1>
        <p className="text-muted-foreground">
          Review and grade assessments with descriptive questions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessments Awaiting Grading</CardTitle>
          <CardDescription>
            {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"} pending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingGradingTable attempts={attempts} />
        </CardContent>
      </Card>
    </div>
  )
}
