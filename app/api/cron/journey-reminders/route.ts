import { NextResponse } from "next/server";
import { checkOverduePhases } from "@/lib/journey-engine";

/**
 * Journey Reminders Cron Job
 * Runs daily to check for overdue phases and send notifications
 * 
 * To configure:
 * - Vercel: Add cron configuration in vercel.json
 * - Other: Set up daily cron job to hit this endpoint
 */

export async function GET(request: Request) {
  try {
    // Verify authorization (use a secret token in production)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Running journey overdue check...");

    const overdueCount = await checkOverduePhases();

    console.log(`Marked ${overdueCount} phases as overdue`);

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueCount} overdue phases`,
      overdueCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Journey reminders cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process journey reminders",
      },
      { status: 500 }
    );
  }
}
