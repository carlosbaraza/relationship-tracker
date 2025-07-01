"use client";

import { useSession } from "next-auth/react";
import { Download, Smartphone, User, Mail, Shield, Cloud, HardDrive } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");

      const isPWA =
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: standalone)").matches;

      const isInApp = /Android.*; wv\)|iPhone.*; CPU.*OS.*; Mobile.*Safari/i.test(
        navigator.userAgent
      );

      const isPWAEnvironment =
        window.location.search.includes("pwa=true") ||
        window.localStorage.getItem("pwa-installed") === "true";

      return isStandalone || isPWA || isInApp || isPWAEnvironment;
    };

    // Check if installation prompt is available
    const checkInstallable = () => {
      return typeof window !== "undefined" && (window as any).triggerPWAInstall;
    };

    // Check if user has dismissed install prompt
    const checkDismissed = () => {
      return localStorage.getItem("pwa-install-dismissed") === "true";
    };

    // Check if iOS device
    const checkIfIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent);
    };

    setIsInstalled(checkIfInstalled());
    setCanInstall(checkInstallable());
    setInstallDismissed(checkDismissed());
    setIsIOS(checkIfIOS());
  }, []);

  const handleInstall = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).triggerPWAInstall) {
        await (window as any).triggerPWAInstall();
        // Don't auto-dismiss here, let user see success message
      } else {
        // Fallback for iOS Safari
        alert(
          'To install this app:\n\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n3. Tap "Add"'
        );
      }
    } catch (error) {
      console.error("Error triggering install:", error);
    }
  };

  const handleResetInstallPrompt = () => {
    localStorage.removeItem("pwa-install-dismissed");
    localStorage.removeItem("pwa-installed");
    setInstallDismissed(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your app preferences and installation options
        </p>
      </div>

      {/* User Information Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account</h2>
        </div>

        <div className="space-y-3">
          {/* Data Storage Type */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            {session?.user ? (
              <>
                <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Cloud Storage
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Your data is synced to the cloud
                  </p>
                </div>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Local Storage
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Your data is stored locally on this device
                  </p>
                </div>
              </>
            )}
          </div>

          {session?.user ? (
            <div className="space-y-3">
              {session.user.email && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Not signed in</span>
              </div>
              <a
                href="/login"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
              >
                Sign in
              </a>
            </div>
          )}
        </div>
      </div>

      {/* App Installation Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            App Installation
          </h2>
        </div>

        <div className="space-y-4">
          {isInstalled ? (
            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  App is installed
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Elector is running as an installed app
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Install Elector App
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      Get quick access, push notifications, and native app experience
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {canInstall ? (
                        <>
                          {isIOS ? (
                            <button
                              onClick={() => setShowIOSInstructions(!showIOSInstructions)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              <span>{showIOSInstructions ? "Hide" : "Show"} Instructions</span>
                            </button>
                          ) : (
                            <button
                              onClick={handleInstall}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              <span>Install App</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-600 dark:text-gray-400 p-2">
                          Install option not available in this browser
                        </div>
                      )}
                    </div>

                    {isIOS && showIOSInstructions && (
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                        <div className="text-blue-700 dark:text-blue-300 space-y-2 text-sm">
                          <p className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                            How to install on iPhone:
                          </p>
                          <div className="space-y-2">
                            <p>
                              1. Tap the <strong>Share</strong> button{" "}
                              <span className="text-lg">⎘</span> at the bottom of Safari
                            </p>
                            <p>
                              2. Scroll down and tap <strong>"Add to Home Screen"</strong>
                            </p>
                            <p>
                              3. Tap <strong>"Add"</strong> in the top right corner
                            </p>
                          </div>
                          <p className="text-blue-600 dark:text-blue-400 italic mt-3 text-xs">
                            The app will appear on your home screen for quick access and
                            notifications!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {installDismissed && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Install banner is hidden
                    </p>
                    <button
                      onClick={handleResetInstallPrompt}
                      className="text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 font-medium"
                    >
                      Show banner again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              <strong>Benefits of installing:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Quick access from home screen</li>
              <li>Push notifications for reminders</li>
              <li>Native app experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
