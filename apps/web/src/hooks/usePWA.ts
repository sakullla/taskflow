import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  install: () => Promise<boolean>;
  dismiss: () => void;
}

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed or running in standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches
        || (window.navigator as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    checkStandalone();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  return {
    canInstall: !!deferredPrompt && !isDismissed && !isInstalled,
    isInstalled,
    isStandalone,
    install,
    dismiss,
  };
}
