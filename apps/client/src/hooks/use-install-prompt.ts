import { useEffect, useState } from "react";

interface InstallPromptState {
  isSupported: boolean;
  isIOS: boolean;
  isIOSSafari: boolean;
  isIOSChrome: boolean;
  isInstalled: boolean;
  promptInstall: () => void;
}

export const useInstallPrompt = (): InstallPromptState => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isIOSChrome, setIsIOSChrome] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari =
      /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);

    setIsIOS(isIOSDevice);
    setIsIOSSafari(isIOSDevice && isSafari);
    setIsIOSChrome(isIOSDevice && isChrome);

    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isFullscreen = window.matchMedia(
      "(display-mode: fullscreen)"
    ).matches;
    const isMinimalUI = window.matchMedia("(display-mode: minimal-ui)").matches;
    const isPWAInstalled = isStandalone || isFullscreen || isMinimalUI;
    setIsInstalled(isPWAInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }

    if (isIOSDevice) {
      setIsSupported(!isPWAInstalled);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsSupported(true);
      };

      window.addEventListener("beforeinstallprompt", handler);

      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }
  }, []);

  const promptInstall = async () => {
    if (isIOS) {
      return;
    }

    if (deferredPrompt && "prompt" in deferredPrompt) {
      const promptEvent = deferredPrompt as any;
      promptEvent.prompt();
      const result = await promptEvent.userChoice;
      console.log("User choice:", result);
      setDeferredPrompt(null);
    }
  };

  return {
    isSupported,
    isIOS,
    isIOSSafari,
    isIOSChrome,
    isInstalled,
    promptInstall,
  };
};
