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

      // If permission granted, register for push notifications
      if (this.permission === "granted") {
        await this.subscribeToPush();
      }

      return this.permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }

  async subscribeToPush(): Promise<boolean> {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      console.log("Push messaging is not supported");
      return false;
    }

    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Get existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Get VAPID public key from server
        const response = await fetch("/api/push/subscribe");
        const { publicKey } = await response.json();

        if (!publicKey) {
          console.error("No VAPID public key available");
          return false;
        }

        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicKey),
        });
      }

      // Send subscription to server
      const subscribeResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription,
          userAgent: navigator.userAgent,
        }),
      });

      if (subscribeResponse.ok) {
        console.log("Successfully subscribed to push notifications");
        return true;
      } else {
        console.error("Failed to subscribe to push notifications");
        return false;
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Notify server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        console.log("Successfully unsubscribed from push notifications");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  // Helper function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
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
