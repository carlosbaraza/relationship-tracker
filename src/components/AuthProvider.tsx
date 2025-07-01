"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StorageManager } from "@/lib/storage-manager";
import { notificationService } from "@/lib/notifications";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  storageManager: StorageManager;
  hasLocalData: boolean;
  migrateData: () => Promise<void>;
  clearLocalData: () => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  canShowNotifications: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [canShowNotifications, setCanShowNotifications] = useState(false);
  const [storageManager] = useState(() => StorageManager.getInstance());

  const isAuthenticated = !!session?.user;
  storageManager.setAuthStatus(isAuthenticated);

  const isLoading = status === "loading";

  useEffect(() => {
    // Check for local data
    setHasLocalData(storageManager.hasLocalData());

    // Check notification permission
    setCanShowNotifications(notificationService.canShowNotifications());
  }, [storageManager]);

  // Set up periodic reminder checking when not loading
  useEffect(() => {
    if (isLoading) return;

    let cleanup: (() => void) | undefined;

    // Start periodic reminder checking if notifications are available
    if (notificationService.canShowNotifications()) {
      cleanup = notificationService.startPeriodicCheck(
        () => storageManager.getDueReminders(),
        async (contactId: string) => {
          const contact = await storageManager.getContact(contactId);
          return contact?.name || null;
        },
        15 // Check every 15 minutes
      );
    }

    // Immediate check for due reminders
    const checkImmediately = async () => {
      if (notificationService.canShowNotifications()) {
        await notificationService.checkAndNotifyDueReminders(
          () => storageManager.getDueReminders(),
          async (contactId: string) => {
            const contact = await storageManager.getContact(contactId);
            return contact?.name || null;
          }
        );
      }
    };

    // Check after a short delay to ensure data is loaded
    const timeoutId = setTimeout(checkImmediately, 3000);

    return () => {
      if (cleanup) cleanup();
      clearTimeout(timeoutId);
    };
  }, [isLoading, storageManager]);

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    const permission = await notificationService.requestPermission();
    setCanShowNotifications(notificationService.canShowNotifications());
    return permission;
  };

  const migrateData = async () => {
    if (isAuthenticated && hasLocalData) {
      await storageManager.migrateToCloud();
      setHasLocalData(false);
    }
  };

  const clearLocalData = async () => {
    await storageManager.clearLocalData();
    setHasLocalData(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        storageManager,
        hasLocalData,
        migrateData,
        clearLocalData,
        requestNotificationPermission,
        canShowNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
