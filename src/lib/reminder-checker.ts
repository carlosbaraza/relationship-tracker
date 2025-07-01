import { db } from "./db";
import { pushNotificationService } from "./push-service";
import { validateVapidConfig } from "./vapid";
import { addMinutes } from "date-fns";

export interface ReminderCheckResult {
  usersChecked: number;
  remindersSent: number;
  errors: string[];
}

export class ReminderChecker {
  private static instance: ReminderChecker;

  private constructor() {}

  static getInstance(): ReminderChecker {
    if (!ReminderChecker.instance) {
      ReminderChecker.instance = new ReminderChecker();
    }
    return ReminderChecker.instance;
  }

  async checkAndSendReminders(): Promise<ReminderCheckResult> {
    const result: ReminderCheckResult = {
      usersChecked: 0,
      remindersSent: 0,
      errors: [],
    };

    // Validate VAPID configuration
    if (!validateVapidConfig()) {
      result.errors.push("VAPID keys not configured");
      return result;
    }

    try {
      console.log("Checking for due reminders...");

      const now = new Date();

      // Get all users who have active push subscriptions
      const usersWithSubscriptions = await db.user.findMany({
        where: {
          pushSubscriptions: {
            some: {
              isActive: true,
            },
          },
        },
        include: {
          pushSubscriptions: {
            where: {
              isActive: true,
            },
          },
        },
      });

      console.log(`Found ${usersWithSubscriptions.length} users with active subscriptions`);

      // Check reminders for each user
      for (const user of usersWithSubscriptions) {
        try {
          result.usersChecked++;

          // Get due reminders for this user
          const dueReminders = await db.reminder.findMany({
            where: {
              contact: {
                userId: user.id,
              },
              isAcknowledged: false,
              dueDate: {
                lte: now,
              },
            },
            include: {
              contact: true,
            },
          });

          if (dueReminders.length === 0) {
            continue;
          }

          console.log(`User ${user.email} has ${dueReminders.length} due reminders`);

          // Check if we've already sent notifications for these reminders recently
          // to avoid spam (don't send same reminder notification more than once per hour)
          const recentNotificationTime = addMinutes(now, -60);

          const recentlyNotifiedReminders = await db.pushSubscription.findMany({
            where: {
              userId: user.id,
              isActive: true,
              lastNotification: {
                gte: recentNotificationTime,
              },
            },
          });

          const shouldSendNotification = recentlyNotifiedReminders.length === 0;

          if (!shouldSendNotification) {
            console.log(`Skipping notifications for user ${user.email} - recently sent`);
            continue;
          }

          // Send notifications
          if (dueReminders.length === 1) {
            // Single reminder notification
            const reminder = dueReminders[0];
            const notificationResult = await pushNotificationService.sendReminderNotification(
              user.id,
              reminder,
              reminder.contact.name
            );

            if (notificationResult.success > 0) {
              result.remindersSent++;
              console.log(`Sent single reminder notification to ${user.email}`);
            } else {
              result.errors.push(
                `Failed to send notification to ${user.email}: ${notificationResult.errors.join(
                  ", "
                )}`
              );
            }
          } else {
            // Multiple reminders notification
            const notificationResult =
              await pushNotificationService.sendMultipleRemindersNotification(
                user.id,
                dueReminders.length
              );

            if (notificationResult.success > 0) {
              result.remindersSent++;
              console.log(
                `Sent multiple reminders notification to ${user.email} (${dueReminders.length} reminders)`
              );
            } else {
              result.errors.push(
                `Failed to send notification to ${user.email}: ${notificationResult.errors.join(
                  ", "
                )}`
              );
            }
          }
        } catch (error: any) {
          result.errors.push(`Error processing user ${user.email}: ${error.message}`);
          console.error(`Error processing user ${user.email}:`, error);
        }
      }

      // Clean up inactive subscriptions
      try {
        const cleanedUp = await pushNotificationService.cleanupInactiveSubscriptions();
        if (cleanedUp > 0) {
          console.log(`Cleaned up ${cleanedUp} inactive subscriptions`);
        }
      } catch (error: any) {
        console.error("Error cleaning up subscriptions:", error);
      }

      if (result.remindersSent > 0 || result.errors.length > 0) {
        console.log("Reminder check completed:", result);
      }
    } catch (error: any) {
      result.errors.push(`Database error: ${error.message}`);
      console.error("Error in reminder check:", error);
    }

    return result;
  }
}

export const reminderChecker = ReminderChecker.getInstance();
