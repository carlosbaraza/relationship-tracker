"use client";

import type { Reminder } from "./types";

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = "default";

  private constructor() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }

    if (this.permission === "granted") {
      return "granted";
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }

  canShowNotifications(): boolean {
    return (
      typeof window !== "undefined" && "Notification" in window && this.permission === "granted"
    );
  }

  showReminderNotification(reminder: Reminder, contactName: string): void {
    if (!this.canShowNotifications()) {
      console.log("Notifications not available or not permitted");
      return;
    }

    const title = `Reminder: ${reminder.title}`;
    const body = `For ${contactName}${reminder.description ? ` - ${reminder.description}` : ""}`;

    const notification = new Notification(title, {
      body,
      icon: "/icon-256.png",
      badge: "/icon-256.png",
      tag: `reminder-${reminder.id}`,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/contacts/${reminder.contactId}`;
      notification.close();
    };

    // Auto-close after 10 seconds if not interacted with
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  showMultipleRemindersNotification(reminderCount: number): void {
    if (!this.canShowNotifications()) {
      return;
    }

    const title = `${reminderCount} Reminder${reminderCount > 1 ? "s" : ""} Due`;
    const body = `You have ${reminderCount} reminder${
      reminderCount > 1 ? "s" : ""
    } that need your attention.`;

    const notification = new Notification(title, {
      body,
      icon: "/icon-256.png",
      badge: "/icon-256.png",
      tag: "multiple-reminders",
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = "/";
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  // Check for due reminders and show notifications
  async checkAndNotifyDueReminders(
    getDueReminders: () => Promise<any[]>,
    getContactName: (contactId: string) => Promise<string | null>
  ): Promise<void> {
    if (!this.canShowNotifications()) {
      return;
    }

    try {
      const dueReminders = await getDueReminders();

      if (dueReminders.length === 0) {
        return;
      }

      if (dueReminders.length === 1) {
        const reminder = dueReminders[0];
        const contactName = (await getContactName(reminder.contactId)) || "Unknown Contact";
        this.showReminderNotification(reminder, contactName);
      } else {
        this.showMultipleRemindersNotification(dueReminders.length);
      }
    } catch (error) {
      console.error("Error checking due reminders:", error);
    }
  }

  // Schedule periodic checks for due reminders
  startPeriodicCheck(
    getDueReminders: () => Promise<any[]>,
    getContactName: (contactId: string) => Promise<string | null>,
    intervalMinutes: number = 15
  ): () => void {
    const interval = setInterval(() => {
      this.checkAndNotifyDueReminders(getDueReminders, getContactName);
    }, intervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}

export const notificationService = NotificationService.getInstance();
