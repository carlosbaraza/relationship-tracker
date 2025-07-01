const CACHE_NAME = "elector-v1";
const STATIC_RESOURCES = [
  "/",
  "/login",
  "/manifest.json",
  "/icon-256.png",
  "/icon-512.png",
  // Add other static assets as needed
];

// Install event - cache static resources
self.addEventListener("install", (event) => {
  console.log("Service Worker: Install event");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static resources");
        return cache.addAll(STATIC_RESOURCES);
      })
      .catch((error) => {
        console.log("Service Worker: Cache failed", error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate event");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Deleting old cache", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Immediately claim control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return fetchResponse;
          })
          .catch(() => {
            // Return offline page for navigation requests when offline
            if (event.request.mode === "navigate") {
              return caches.match("/");
            }
          })
      );
    })
  );
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
    // Re-subscribe to push notifications
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: null, // You'll need to add your VAPID key here
      })
      .then((subscription) => {
        // Send new subscription to server
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });
      })
  );
});
