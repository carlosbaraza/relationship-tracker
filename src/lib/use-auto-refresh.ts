"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAutoRefreshOptions {
  /** Interval in milliseconds (default: 60000 = 1 minute) */
  interval?: number;
  /** Whether auto-refresh is enabled (default: true) */
  enabled?: boolean;
  /** Whether to refresh immediately on mount (default: false) */
  refreshOnMount?: boolean;
}

/**
 * Custom hook that provides automatic data refresh functionality
 * @param refreshCallback Function to call for refreshing data
 * @param options Configuration options
 * @returns Object with manual refresh function and interval state
 */
export function useAutoRefresh(
  refreshCallback: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const {
    interval = 60000, // 1 minute default
    enabled = true,
    refreshOnMount = false,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Wrap the refresh callback to prevent concurrent calls
  const safeRefreshCallback = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    try {
      await refreshCallback();
    } catch (error) {
      console.error("Auto-refresh failed:", error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshCallback]);

  // Manual refresh function that can be called by components
  const manualRefresh = useCallback(async () => {
    await safeRefreshCallback();
  }, [safeRefreshCallback]);

  // Set up the auto-refresh interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Refresh on mount if requested
    if (refreshOnMount) {
      safeRefreshCallback();
    }

    // Set up the interval
    intervalRef.current = setInterval(safeRefreshCallback, interval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, safeRefreshCallback, refreshOnMount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    manualRefresh,
    isEnabled: enabled,
    interval,
  };
}
