import { NextResponse } from "next/server";
import { reminderScheduler } from "@/lib/reminder-scheduler";

export async function GET() {
  try {
    const status = reminderScheduler.getStatus();

    return NextResponse.json({
      success: true,
      scheduler: status,
      message: status.isRunning
        ? `Reminder scheduler is running (checks every ${status.checkIntervalMinutes} minutes)`
        : "Reminder scheduler is not running",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get scheduler status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Manual trigger for testing
    reminderScheduler.triggerCheck();

    return NextResponse.json({
      success: true,
      message: "Manual reminder check triggered",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger manual check",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
