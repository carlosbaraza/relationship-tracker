import webpush from "web-push";

// VAPID keys configuration
export const VAPID_KEYS = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
  subject: process.env.VAPID_SUBJECT || "mailto:support@elector.app",
};

// Initialize web-push with VAPID keys
if (VAPID_KEYS.publicKey && VAPID_KEYS.privateKey) {
  webpush.setVapidDetails(VAPID_KEYS.subject, VAPID_KEYS.publicKey, VAPID_KEYS.privateKey);
}

// Generate VAPID keys (run this once and save to environment variables)
export function generateVapidKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log("VAPID Keys Generated:");
  console.log("Public Key:", vapidKeys.publicKey);
  console.log("Private Key:", vapidKeys.privateKey);
  console.log("\nAdd these to your .env file:");
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log(`VAPID_SUBJECT=mailto:support@elector.app`);
  return vapidKeys;
}

// Validate VAPID configuration
export function validateVapidConfig(): boolean {
  if (!VAPID_KEYS.publicKey || !VAPID_KEYS.privateKey) {
    console.error(
      "VAPID keys not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables."
    );
    return false;
  }
  return true;
}

export { webpush };
