# Push Notifications Setup Guide

## ✅ Implementation Complete!

Your Elector app now has a complete push notification system with:

- **Server-side push notifications** using web-push
- **PWA installation** support for iOS and Android
- **Background notification workers**
- **Automatic reminder checking**
- **Subscription management**

## 🚀 Quick Setup

### 1. Configure Environment Variables

The VAPID keys have been generated for you. Add these to your `.env` file:

```bash
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BE73ZiHYp-OmIEPMtzR83zAIv4XdhzAlnop5TcpAh8GX7uk0Sc2KCmRSWG-2SZNXou4bsO8RScoxw-aFEV-vZdg
VAPID_PRIVATE_KEY=g1VkZNNh5nYO1KJvvm1VHiqu7P3Cn5b00zQMB-X5kU4
VAPID_SUBJECT=mailto:support@elector.app

# Optional: Secure your cron endpoint
CRON_SECRET=KVBmlryRiWWpVsQpAKEIKLnRXrjhP1HW
```

### 2. Create App Icons

You need to create the app icons referenced in the manifest. You can:

**Option A: Create your own icons**
- Create PNG icons in sizes: 256x256, 512x512, 1024x1024
- Name them: `icon-256.png`, `icon-512.png`, `icon-1024.png`
- Place them in the `public/` directory

**Option B: Use a placeholder**
For testing, you can copy any existing icon and rename it to the required sizes.

### 3. Deploy Your App

Deploy your app to your hosting platform with the environment variables configured.

## 📱 How It Works

### User Experience

1. **Installation**: Users can install the app to their home screen
2. **Permission Request**: App requests notification permission when needed
3. **Background Notifications**: Users receive push notifications even when the app is closed
4. **Smart Scheduling**: Notifications are sent only when reminders are due

### Technical Flow

1. **Client Registration**: 
   - Service worker registers for push notifications
   - Client sends subscription to `/api/push/subscribe`

2. **Reminder Checking**:
   - Scheduled worker calls `/api/notifications/check-reminders`
   - Checks all users for due reminders
   - Sends targeted notifications

3. **Notification Delivery**:
   - Server uses web-push to send notifications
   - Service worker displays notifications
   - Click actions navigate to relevant pages

## 🛠 API Endpoints

### Push Subscription Management

- `POST /api/push/subscribe` - Register for push notifications
- `DELETE /api/push/subscribe` - Unsubscribe from push notifications
- `GET /api/push/subscribe` - Get VAPID public key

### Notification Workers

- `POST /api/notifications/check-reminders` - Check and send due reminder notifications
- `POST /api/notifications/test` - Send test notification to current user

## 🔧 Testing the Setup

### 1. Test Push Notifications Locally

```bash
# Start your development server
npm run dev

# In another terminal, test notifications
npm run test-notifications
```

### 2. Test Reminder Checking

```bash
# Manually trigger reminder check
npm run check-reminders
```

### 3. Test with Real Devices

1. Deploy your app to a public URL (required for push notifications)
2. Open the app on a mobile device
3. Install the app to home screen
4. Grant notification permissions
5. Create a reminder and wait for it to be due

## ⏰ Setting Up Automated Reminder Checking

### Option 1: Vercel Cron Jobs (Recommended)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/check-reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use a service like cron-job.org to call your endpoint every 15 minutes:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/notifications/check-reminders
```

### Option 3: Client-Side Periodic Check

The app already includes a client-side periodic check that runs every 15 minutes when the app is open.

## 🔒 Security Notes

1. **Keep VAPID keys secure** - Never commit them to version control
2. **Use CRON_SECRET** - Protect your reminder check endpoint
3. **Validate permissions** - Only authenticated users can subscribe
4. **Rate limiting** - Consider adding rate limits to prevent abuse

## 🐛 Troubleshooting

### Notifications Not Working

1. **Check VAPID Keys**: Ensure they're properly set in environment variables
2. **HTTPS Required**: Push notifications require HTTPS in production
3. **Permission Denied**: User must grant notification permission
4. **Service Worker**: Ensure service worker is registered correctly

### Debug Steps

1. Check browser console for errors
2. Verify service worker registration in DevTools
3. Check Network tab for failed API calls
4. Verify database has push subscriptions

### Common Issues

- **iOS Safari**: Requires user gesture to request permissions
- **Chrome**: May show warnings about self-signed certificates
- **Firefox**: Has stricter notification policies

## 📈 Monitoring and Analytics

Consider adding monitoring for:

- Push subscription success/failure rates
- Notification delivery rates
- User engagement with notifications
- Service worker errors

## 🎯 Next Steps

1. **Add notification preferences** - Let users choose notification frequency
2. **Implement notification actions** - Add quick actions to notifications
3. **Rich notifications** - Add images and more complex layouts
4. **Analytics** - Track notification effectiveness
5. **A/B testing** - Test different notification strategies

## 📚 Additional Resources

- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [PWA Best Practices](https://web.dev/pwa/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

## 🎉 Congratulations!

Your Elector app now has a complete push notification system that will help users stay connected with their contacts through timely reminders delivered directly to their devices! 