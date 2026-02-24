import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "circle" | "text" | "card" | "avatar";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles = "bg-muted rounded-md";
  const animationStyles = animate ? "animate-pulse" : "";

  const variantStyles = {
    default: "",
    circle: "rounded-full",
    text: "h-4 w-full",
    card: "h-24 w-full",
    avatar: "h-10 w-10 rounded-full",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(baseStyles, animationStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

// Skeleton for task items
export function TaskItemSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
        >
          <Skeleton variant="circle" className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/4 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for task list page
export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="text" className="w-32 h-8" />
      </div>

      {/* Add task input skeleton */}
      <Skeleton variant="card" className="h-14" />

      {/* Task items skeleton */}
      <TaskItemSkeleton count={5} />
    </div>
  );
}

// Skeleton for sidebar
export function SidebarSkeleton() {
  return (
    <div className="w-64 h-full p-4 space-y-4">
      {/* Logo skeleton */}
      <Skeleton variant="text" className="w-16 h-6 mb-6" />

      {/* Navigation items skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton variant="circle" className="w-5 h-5" />
            <Skeleton variant="text" className="w-24" />
          </div>
        ))}
      </div>

      {/* Lists section skeleton */}
      <div className="pt-6 space-y-2">
        <Skeleton variant="text" className="w-16 h-4 mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton variant="circle" className="w-2 h-2" />
            <Skeleton variant="text" className="w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for task detail panel
export function TaskDetailSkeleton() {
  return (
    <div className="w-96 h-full p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>

      {/* Title skeleton */}
      <Skeleton variant="text" className="w-full h-8" />

      {/* Action buttons skeleton */}
      <div className="flex gap-2">
        <Skeleton variant="text" className="w-20 h-8" />
        <Skeleton variant="text" className="w-24 h-8" />
        <Skeleton variant="text" className="w-28 h-8" />
      </div>

      {/* Note section skeleton */}
      <div className="space-y-2">
        <Skeleton variant="text" className="w-12" />
        <Skeleton variant="card" className="h-24" />
      </div>

      {/* Steps section skeleton */}
      <div className="space-y-2">
        <Skeleton variant="text" className="w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton variant="circle" className="w-5 h-5" />
            <Skeleton variant="text" className="w-full" />
          </div>
        ))}
      </div>

      {/* Delete button skeleton */}
      <Skeleton variant="text" className="w-full h-9 mt-4" />
    </div>
  );
}

// Skeleton for settings page
export function SettingsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="text" className="w-32 h-8" />
      </div>

      {/* Settings cards skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton variant="circle" className="w-5 h-5" />
            <Skeleton variant="text" className="w-24" />
          </div>
          <Skeleton variant="text" className="w-3/4 h-4" />
          <div className="flex gap-3 pt-2">
            <Skeleton variant="text" className="w-20 h-9" />
            <Skeleton variant="text" className="w-20 h-9" />
            <Skeleton variant="text" className="w-20 h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for search page
export function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="text" className="w-32 h-8" />
      </div>

      {/* Search input skeleton */}
      <Skeleton variant="card" className="h-14" />

      {/* Results skeleton */}
      <TaskItemSkeleton count={3} />
    </div>
  );
}

// Full page loading spinner
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "border-primary/30 border-t-primary rounded-full animate-spin",
          sizeClasses[size]
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

// Full page loader overlay
interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Inline loader for buttons
export function ButtonLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin",
        className
      )}
    />
  );
}
