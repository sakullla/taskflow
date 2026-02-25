import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function PWAInstallPrompt() {
  const { t } = useTranslation("common");
  const { canInstall, install, dismiss } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (canInstall && !hasDismissed) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  const handleDismiss = () => {
    setIsVisible(false);
    dismiss();
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="rounded-lg border border-border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              {t("pwa.installTitle", "安装 TaskFlow")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("pwa.installDescription", "安装到主屏幕，快速访问你的任务")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -mt-1 -mr-1 h-7 w-7"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDismiss}
          >
            {t("actions.cancel", "取消")}
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleInstall}
          >
            {t("pwa.install", "安装")}
          </Button>
        </div>
      </div>
    </div>
  );
}
