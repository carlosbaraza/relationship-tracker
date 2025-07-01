import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push-service";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Sending test notification to user: ${session.user.email}`);

    // Send test notification
    const result = await pushNotificationService.sendTestNotification(session.user.id);

    if (result.success > 0) {
      return NextResponse.json({
        success: true,
        message: "Test notification sent successfully",
        details: {
          sent: result.success,
          failed: result.failed,
          errors: result.errors,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send test notification",
          details: {
            sent: result.success,
            failed: result.failed,
            errors: result.errors,
          },
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test notification endpoint. Use POST to send a test notification.",
    endpoint: "/api/notifications/test",
  });
}
