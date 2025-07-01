"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";

export default function InstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed with multiple detection methods
    const checkIfInstalled = () => {
      // Method 1: Check if running in standalone mode
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");

      // Method 2: Check if launched from home screen (PWA)
      const isPWA =
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: standalone)").matches;

      // Method 3: Check if user agent suggests PWA
      const isInApp = /Android.*; wv\)|iPhone.*; CPU.*OS.*; Mobile.*Safari/i.test(
        navigator.userAgent
      );

      // Method 4: Check if there's a specific PWA environment variable
      const isPWAEnvironment =
        window.location.search.includes("pwa=true") ||
        window.localStorage.getItem("pwa-installed") === "true";

      const installed = isStandalone || isPWA || isInApp || isPWAEnvironment;
      setIsInstalled(installed);

      if (installed) {
        console.log("PWA appears to be installed");
      }

      return installed;
    };

    // Check if installation prompt is available
    const checkInstallable = () => {
      return typeof window !== "undefined" && (window as any).triggerPWAInstall;
    };

    // Initial checks
    const installed = checkIfInstalled();

    // Show banner immediately if basic conditions are met
    if (!installed && !localStorage.getItem("pwa-install-dismissed")) {
      setIsVisible(true);
    }

    // Check for install capability once initially
    const initialInstallable = checkInstallable();
    setCanInstall(initialInstallable);

    // Listen for beforeinstallprompt event to detect when install becomes available
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Store the event so it can be triggered later
      (window as any).deferredPrompt = e;
      (window as any).triggerPWAInstall = async () => {
        const deferredPrompt = (window as any).deferredPrompt;
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const result = await deferredPrompt.userChoice;
          (window as any).deferredPrompt = null;
          return result;
        }
      };
      setCanInstall(true);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem("pwa-installed", "true");
      localStorage.setItem("pwa-install-dismissed", "true");
      (window as any).deferredPrompt = null;
      (window as any).triggerPWAInstall = null;
    };

    // Add event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // One-time delayed check for iOS Safari support
    const delayedCheck = setTimeout(() => {
      // For iOS Safari, we can't detect beforeinstallprompt, so check for iOS and show install instructions
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = (window.navigator as any).standalone;

      setIsIOS(isIOSDevice);

      if (
        isIOSDevice &&
        !isInStandaloneMode &&
        !installed &&
        !localStorage.getItem("pwa-install-dismissed")
      ) {
        setCanInstall(true);
        (window as any).triggerPWAInstall = async () => {
          // For iOS, we just show instructions
          return { outcome: "accepted" };
        };
      }
    }, 1000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(delayedCheck);
    };
  }, []);

  const handleInstall = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).triggerPWAInstall) {
        await (window as any).triggerPWAInstall();
      } else {
        // Fallback for iOS Safari
        alert(
          'To install this app:\n\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n3. Tap "Add"'
        );
      }
    } catch (error) {
      console.error("Error triggering install:", error);
    }
    // Mark as permanently dismissed after install attempt
    localStorage.setItem("pwa-install-dismissed", "true");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Permanently dismiss the banner
    localStorage.setItem("pwa-install-dismissed", "true");
    setIsVisible(false);
  };

  // Don't show if installed, not installable, or not visible
  if (isInstalled || !canInstall || !isVisible) {
    return null;
  }

  if (isIOS) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-blue-800">
              <strong>Install Elector</strong> for quick access and notifications
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIOSInstructions(!showIOSInstructions)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <Download className="w-3 h-3" />
              <span>{showIOSInstructions ? "Hide" : "Show"} Instructions</span>
            </button>

            <button
              onClick={handleDismiss}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1"
            >
              Don't show again
            </button>
          </div>
        </div>

        {showIOSInstructions && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="text-blue-700 space-y-2 text-xs">
              <p className="font-medium text-blue-800 mb-2">How to install on iPhone:</p>
              <p>
                1. Tap the <strong>Share</strong> button <span className="text-lg">⎘</span> at the
                bottom of Safari
              </p>
              <p>
                2. Scroll down and tap <strong>"Add to Home Screen"</strong>
              </p>
              <p>
                3. Tap <strong>"Add"</strong> in the top right corner
              </p>
              <p className="text-blue-600 italic mt-2">
                The app will appear on your home screen for quick access!
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-blue-800">
            <strong>Install Elector</strong> for quick access and notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            <Download className="w-3 h-3" />
            <span>Install</span>
          </button>

          <button
            onClick={handleDismiss}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}
