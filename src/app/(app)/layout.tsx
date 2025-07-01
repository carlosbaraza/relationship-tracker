"use client";

import { useAuth } from "@/components/AuthProvider";
import { signOut } from "next-auth/react";
import { LogOut, User, Cloud, HardDrive } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasLocalData, migrateData, clearLocalData } = useAuth();
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out? Local data will be cleared.")) {
      clearLocalData();
      signOut();
    }
  };

  const handleMigrateData = async () => {
    await migrateData();
    setShowMigrationModal(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Elector</h1>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              {isAuthenticated ? (
                <>
                  <Cloud className="w-4 h-4" />
                  <span className="hidden sm:inline">Cloud Storage</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span className="hidden sm:inline">Local Storage</span>
                </>
              )}
            </div>

            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Data Migration Banner */}
      {isAuthenticated && hasLocalData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Migrate your local data to the cloud
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Your local contacts and interactions can be synced to your account
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowMigrationModal(true)}
                  className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Migrate Data
                </button>
                <button
                  onClick={clearLocalData}
                  className="px-3 py-2 text-blue-600 dark:text-blue-400 text-sm hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

      {/* Migration Confirmation Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Migrate Data to Cloud
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will copy all your local contacts and interactions to your cloud account. Your
              local data will be cleared after migration.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMigrationModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMigrateData}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Migrate Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
