import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateVapidConfig } from "@/lib/vapid";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate VAPID configuration
    if (!validateVapidConfig()) {
      return NextResponse.json(
        { error: "Push notifications not configured on server" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth: authKey } = keys;

    if (!p256dh || !authKey) {
      return NextResponse.json({ error: "Missing subscription keys" }, { status: 400 });
    }

    // Check if subscription already exists
    const existingSubscription = await db.pushSubscription.findUnique({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: endpoint,
        },
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      const updatedSubscription = await db.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dhKey: p256dh,
          authKey: authKey,
          userAgent: userAgent || null,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription updated",
        subscriptionId: updatedSubscription.id,
      });
    } else {
      // Create new subscription
      const newSubscription = await db.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: endpoint,
          p256dhKey: p256dh,
          authKey: authKey,
          userAgent: userAgent || null,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription created",
        subscriptionId: newSubscription.id,
      });
    }
  } catch (error) {
    console.error("Error handling push subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    // Mark subscription as inactive
    const updatedSubscription = await db.pushSubscription.updateMany({
      where: {
        userId: session.user.id,
        endpoint: endpoint,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription removed",
      updated: updatedSubscription.count,
    });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  // Return VAPID public key for client-side subscription
  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  });
}
