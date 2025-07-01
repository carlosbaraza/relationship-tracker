import { NextRequest, NextResponse } from "next/server";
import { reminderChecker } from "@/lib/reminder-checker";

// This endpoint can be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get("authorization");
    const expectedAuth = process.env.CRON_SECRET;

    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting reminder check job...");

    // Use the shared reminder checker service
    const results = await reminderChecker.checkAndSendReminders();

    console.log("Reminder check job completed:", results);

    return NextResponse.json({
      success: true,
      message: "Reminder check completed",
      results,
    });
  } catch (error: any) {
    console.error("Error in reminder check job:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Reminder check endpoint is active. Use POST to trigger a check.",
    endpoint: "/api/notifications/check-reminders",
  });
}
