import { reminderChecker } from "./reminder-checker";
import { validateVapidConfig } from "./vapid";

class ReminderScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkIntervalMinutes = 15; // Check every 15 minutes

  constructor() {
    console.log("ReminderScheduler initialized");
  }

  start() {
    if (this.isRunning) {
      console.log("ReminderScheduler is already running");
      return;
    }

    // Validate VAPID configuration before starting
    if (!validateVapidConfig()) {
      console.log("ReminderScheduler: VAPID keys not configured, scheduler will not start");
      return;
    }

    console.log(`Starting ReminderScheduler - checking every ${this.checkIntervalMinutes} minutes`);

    // Run immediately on start
    this.checkReminders();

    // Set up interval for periodic checks
    this.intervalId = setInterval(() => {
      this.checkReminders();
    }, this.checkIntervalMinutes * 60 * 1000);

    this.isRunning = true;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("ReminderScheduler stopped");
  }

  private async checkReminders() {
    try {
      console.log("ReminderScheduler: Checking for due reminders...");

      // Use the shared reminder checker service
      const results = await reminderChecker.checkAndSendReminders();

      if (results.remindersSent > 0 || results.errors.length > 0) {
        console.log("ReminderScheduler check completed:", results);
      }
    } catch (error: any) {
      console.error("ReminderScheduler: Error in reminder check:", error);
    }
  }

  // Method to manually trigger a check (useful for testing)
  triggerCheck() {
    console.log("ReminderScheduler: Manual check triggered");
    this.checkReminders();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMinutes: this.checkIntervalMinutes,
      intervalId: this.intervalId !== null,
    };
  }
}

// Create singleton instance
export const reminderScheduler = new ReminderScheduler();
