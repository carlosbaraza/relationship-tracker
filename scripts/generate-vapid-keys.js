const webpush = require("web-push");

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log("=".repeat(60));
console.log("VAPID KEYS GENERATED");
console.log("=".repeat(60));
console.log();
console.log("Add these to your .env file:");
console.log();
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:support@elector.app`);
console.log();
console.log("Optional: Add a secret for cron job authentication:");
console.log(`CRON_SECRET=${generateRandomString(32)}`);
console.log();
console.log("=".repeat(60));
console.log("IMPORTANT: Keep these keys secure and never commit them to version control!");
console.log("=".repeat(60));

function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
