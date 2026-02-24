import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({
  size = "md",
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  const { t } = useTranslation("common");
  const loadingText = text || t("loading") || "Loading...";

  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "border-primary/30 border-t-primary rounded-full animate-spin",
          sizeClasses[size]
        )}
      />
      {loadingText && (
        <p className="text-sm text-muted-foreground animate-pulse">{loadingText}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

// Loading overlay for partial content
interface LoadingOverlayProps {
  children: React.ReactNode;
  isLoading: boolean;
  text?: string;
}

export function LoadingOverlay({ children, isLoading, text }: LoadingOverlayProps) {
  const { t } = useTranslation("common");

  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg z-10">
          <Loading size="md" text={text || t("loading")} />
        </div>
      )}
    </div>
  );
}

// Loading state for async buttons
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function LoadingButtonContent({
  isLoading,
  children,
  loadingText,
}: LoadingButtonProps) {
  const { t } = useTranslation("common");

  if (isLoading) {
    return (
      <>
        <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        {loadingText || t("loading")}
      </>
    );
  }

  return <>{children}</>;
}
