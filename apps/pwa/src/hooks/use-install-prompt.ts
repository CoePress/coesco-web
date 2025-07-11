import { useEffect, useState } from "react";

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsSupported(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt && "prompt" in deferredPrompt) {
      // Cast to correct type
      const promptEvent = deferredPrompt as any;
      promptEvent.prompt();
      const result = await promptEvent.userChoice;
      console.log("User choice:", result);
      setDeferredPrompt(null);
    }
  };

  return { isSupported, promptInstall };
}
