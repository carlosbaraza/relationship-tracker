"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StorageManager } from "@/lib/storage-manager";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  storageManager: StorageManager;
  hasLocalData: boolean;
  migrateData: () => Promise<void>;
  clearLocalData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [storageManager] = useState(() => StorageManager.getInstance());

  const isAuthenticated = !!session?.user;
  storageManager.setAuthStatus(isAuthenticated);

  const isLoading = status === "loading";

  useEffect(() => {
    // Check for local data
    setHasLocalData(storageManager.hasLocalData());
  }, [storageManager]);

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
