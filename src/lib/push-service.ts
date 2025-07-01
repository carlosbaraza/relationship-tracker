import { webpush, validateVapidConfig } from "./vapid";
import { db } from "./db";
import type { Reminder } from "./types";

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
}

interface NotificationResult {
  success: number;
  failed: number;
  errors: string[];
}

export class PushNotificationService {
  private static instance: PushNotificationService;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    if (!validateVapidConfig()) {
      result.errors.push("VAPID keys not configured");
      return result;
    }

    try {
      // Get all active subscriptions for the user
      const subscriptions = await db.pushSubscription.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
      });

      if (subscriptions.length === 0) {
        result.errors.push("No active subscriptions found for user");
        return result;
      }

      // Send to all subscriptions
      const promises = subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey,
            },
          };

          await webpush.sendNotification(pushSubscription, JSON.stringify(payload));

          // Update last notification time
          await db.pushSubscription.update({
            where: { id: subscription.id },
            data: { lastNotification: new Date() },
          });

          result.success++;
        } catch (error: any) {
          result.failed++;

          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            });
            result.errors.push(`Subscription ${subscription.id} marked as inactive`);
          } else {
            result.errors.push(`Failed to send to ${subscription.id}: ${error.message}`);
          }
        }
      });

      await Promise.all(promises);
    } catch (error: any) {
      result.errors.push(`Database error: ${error.message}`);
    }

    return result;
  }

  async sendReminderNotification(
    userId: string,
    reminder: Reminder,
    contactName: string
  ): Promise<NotificationResult> {
    const payload: PushPayload = {
      title: `Reminder: ${reminder.title}`,
      body: `For ${contactName}${reminder.description ? ` - ${reminder.description}` : ""}`,
      icon: "/icon-256.png",
      badge: "/icon-256.png",
      url: `/contacts/${reminder.contactId}`,
      tag: `reminder-${reminder.id}`,
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "View Contact",
          icon: "/icon-256.png",
        },
        {
          action: "acknowledge",
          title: "Mark Complete",
        },
      ],
      data: {
        reminderId: reminder.id,
        contactId: reminder.contactId,
        url: `/contacts/${reminder.contactId}`,
      },
    };

    return this.sendToUser(userId, payload);
  }

  async sendMultipleRemindersNotification(
    userId: string,
    reminderCount: number
  ): Promise<NotificationResult> {
    const payload: PushPayload = {
      title: `${reminderCount} Reminder${reminderCount > 1 ? "s" : ""} Due`,
      body: `You have ${reminderCount} reminder${
        reminderCount > 1 ? "s" : ""
      } that need your attention.`,
      icon: "/icon-256.png",
      badge: "/icon-256.png",
      url: "/",
      tag: "multiple-reminders",
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "View Reminders",
          icon: "/icon-256.png",
        },
      ],
      data: {
        type: "multiple-reminders",
        count: reminderCount,
        url: "/",
      },
    };

    return this.sendToUser(userId, payload);
  }

  async sendTestNotification(userId: string): Promise<NotificationResult> {
    const payload: PushPayload = {
      title: "Elector Test Notification",
      body: "Push notifications are working correctly!",
      icon: "/icon-256.png",
      badge: "/icon-256.png",
      url: "/",
      tag: "test-notification",
    };

    return this.sendToUser(userId, payload);
  }

  // Clean up inactive subscriptions
  async cleanupInactiveSubscriptions(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.pushSubscription.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return result.count;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
