"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export default function InstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Check if installation prompt is available
    const checkInstallable = () => {
      if (typeof window !== "undefined" && (window as any).triggerPWAInstall) {
        setCanInstall(true);
      }
    };

    // Delay the check to ensure PWALifecycle has loaded
    const timer = setTimeout(checkInstallable, 1000);

    // Show banner after a delay if conditions are met
    const showTimer = setTimeout(() => {
      if (!isStandalone && !localStorage.getItem("pwa-install-dismissed")) {
        setIsVisible(true);
      }
    }, 5000); // Show after 5 seconds

    return () => {
      clearTimeout(timer);
      clearTimeout(showTimer);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).triggerPWAInstall) {
        await (window as any).triggerPWAInstall();
      } else {
        // Fallback for iOS Safari - show instructions
        alert(
          'To install this app on iOS:\n\n1. Tap the Share button in Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install'
        );
      }
    } catch (error) {
      console.error("Error triggering install:", error);
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleDismissTemporary = () => {
    setIsVisible(false);
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border border-blue-500 rounded-lg p-4 mb-6 relative">
      <button
        onClick={handleDismissTemporary}
        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start space-x-3 pr-8">
        <Smartphone className="w-6 h-6 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Install Elector App</h3>
          <p className="text-blue-100 text-sm mb-4">
            Add Elector to your home screen for quick access and push notifications. Works just like
            a native app!
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleInstall}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>

            <button
              onClick={handleDismiss}
              className="text-sm text-blue-100 hover:text-white transition-colors px-2 py-1"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>

      {/* Benefits list */}
      <div className="mt-4 pt-4 border-t border-blue-500/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-blue-100">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
            <span>Push notifications</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
            <span>Offline access</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
            <span>Fast loading</span>
          </div>
        </div>
      </div>
    </div>
  );
}
