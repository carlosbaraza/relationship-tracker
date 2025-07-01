export async function register() {
  // Only run on server side and in production/development
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("🚀 Starting Elector server instrumentation...");

    // Import and start the reminder scheduler
    const { reminderScheduler } = await import("./src/lib/reminder-scheduler");

    // Add a small delay to ensure database and other services are ready
    setTimeout(() => {
      reminderScheduler.start();
      console.log("✅ Reminder scheduler started automatically");
    }, 5000); // 5 second delay

    // Handle graceful shutdown
    const handleShutdown = () => {
      console.log("🛑 Shutting down reminder scheduler...");
      reminderScheduler.stop();
      process.exit(0);
    };

    process.on("SIGINT", handleShutdown);
    process.on("SIGTERM", handleShutdown);
  }
}
