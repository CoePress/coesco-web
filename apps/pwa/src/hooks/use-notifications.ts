import { useEffect, useState } from "react";

export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  scheduleDaily955Notification: () => void;
  clearScheduledNotification: () => void;
}

export function useNotifications(): NotificationPermissionState {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Notifications are not supported in this browser");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const calculateNextNotificationTime = (): number => {
    const now = new Date();

    // Create a date object for today at 9:55 AM EST
    const target = new Date();
    target.setHours(9, 59, 0, 0);

    // Convert EST to local time
    // EST is UTC-5, so we need to adjust based on the user's timezone
    const estOffset = -5 * 60; // EST offset in minutes
    const localOffset = now.getTimezoneOffset(); // User's timezone offset in minutes
    const offsetDiff = estOffset - localOffset;

    target.setMinutes(target.getMinutes() + offsetDiff);

    // If the target time has already passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime();
  };

  const scheduleDaily955Notification = () => {
    if (!isSupported || permission !== "granted") {
      console.warn(
        "Cannot schedule notification: permissions not granted or not supported"
      );
      return;
    }

    // Clear any existing scheduled notification
    clearScheduledNotification();

    const scheduleNext = () => {
      const nextTime = calculateNextNotificationTime();
      const delay = nextTime - Date.now();

      console.log(
        `Next notification scheduled for: ${new Date(nextTime).toLocaleString()}`
      );

      const timeoutId = setTimeout(() => {
        // Show the notification
        if (permission === "granted") {
          new Notification("Coesco Daily Reminder", {
            body: "Good morning! Time to check your daily business metrics.",
            icon: "/logo-text.png",
            badge: "/logo-text.png",
            tag: "daily-955-reminder",
            requireInteraction: true,
          });
        }

        // Schedule the next notification (24 hours later)
        scheduleNext();
      }, delay);

      // Store the timeout ID for cleanup
      localStorage.setItem("notification-timeout-id", timeoutId.toString());
    };

    scheduleNext();
  };

  const clearScheduledNotification = () => {
    const timeoutId = localStorage.getItem("notification-timeout-id");
    if (timeoutId) {
      clearTimeout(parseInt(timeoutId, 10));
      localStorage.removeItem("notification-timeout-id");
      console.log("Cleared scheduled notification");
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    scheduleDaily955Notification,
    clearScheduledNotification,
  };
}
