import { useEffect, useState } from "react";

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface NotificationHook {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  notify: (options: NotificationOptions) => boolean;
}

export function useNotifications(): NotificationHook {
  const [permission, setPermission]
    = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    }
    catch (error) {
      return false;
    }
  };

  const notify = (options: NotificationOptions): boolean => {
    if (!isSupported) {
      return false;
    }

    if (permission !== "granted") {
      return false;
    }

    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/logo-text.png",
        badge: options.badge || "/logo-text.png",
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });
      return true;
    }
    catch (error) {
      return false;
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    notify,
  };
}
