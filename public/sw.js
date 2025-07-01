// Install event - no caching, just skip waiting
self.addEventListener("install", (event) => {
  console.log("Service Worker: Install event - no caching enabled");
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up any existing caches and claim clients
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate event - clearing all caches");
  event.waitUntil(
    // Delete all existing caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log("Service Worker: Deleting cache", cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  // Immediately claim control of all clients
  self.clients.claim();
});

// Fetch event - always fetch from network, no caching
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Always fetch from network, never cache
  event.respondWith(fetch(event.request));
});

// Push event - handle push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push event received", event);

  let notificationData = {
    title: "Elector Reminder",
    body: "You have a reminder due",
    icon: "/icon-256.png",
    badge: "/icon-256.png",
    tag: "reminder",
    data: {},
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "View Reminder",
        icon: "/icon-256.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.log("Service Worker: Failed to parse push data", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
    })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification click event", event);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Default action or 'view' action
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if the app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          // Focus existing window and navigate if needed
          if (event.notification.data?.url) {
            client.navigate(event.notification.data.url);
          }
          return client.focus();
        }
      }

      // Open new window if app is not open
      const urlToOpen = event.notification.data?.url || "/";
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline functionality
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync event", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks here
      console.log("Service Worker: Performing background sync")
    );
  }
});

// Handle push subscription changes
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Service Worker: Push subscription changed", event);

  event.waitUntil(
    // Get VAPID public key and re-subscribe
    fetch("/api/push/subscribe")
      .then((response) => response.json())
      .then((data) => {
        if (data.publicKey) {
          return self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey),
          });
        }
        throw new Error("No VAPID public key available");
      })
      .then((subscription) => {
        // Send new subscription to server
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: subscription,
            userAgent: navigator.userAgent,
          }),
        });
      })
      .catch((error) => {
        console.error("Service Worker: Failed to resubscribe:", error);
      })
  );
});

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
