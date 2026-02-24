import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      icon: "h-10 w-10",
      title: "text-sm",
      desc: "text-xs",
    },
    md: {
      icon: "h-16 w-16",
      title: "text-lg",
      desc: "text-sm",
    },
    lg: {
      icon: "h-24 w-24",
      title: "text-xl",
      desc: "text-base",
    },
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12",
        className
      )}
    >
      {Icon && (
        <div className="mb-4">
          <Icon
            className={cn(
              "text-muted-foreground/30",
              sizeClasses[size].icon
            )}
            strokeWidth={1.5}
          />
        </div>
      )}
      <h3 className={cn("font-medium text-foreground mb-1", sizeClasses[size].title)}>
        {title}
      </h3>
      {description && (
        <p className={cn("text-muted-foreground max-w-xs", sizeClasses[size].desc)}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Pre-built empty states for common scenarios
import {
  ClipboardList,
  CheckCircle2,
  Search,
  Star,
  Calendar,
  Sun,
  List,
  Inbox,
} from "lucide-react";

export function EmptyTasks({
  className,
  title = "No tasks",
  description = "Start by adding your first task!",
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={ClipboardList}
      title={title}
      description={description}
      className={className}
    />
  );
}

export function EmptyCompleted({
  className,
  title = "No completed tasks",
  description = "Tasks you complete will appear here",
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={CheckCircle2}
      title={title}
      description={description}
      className={className}
    />
  );
}

export function EmptySearch({
  className,
  title = "No results found",
  description = "Try a different search term",
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Search}
      title={title}
      description={description}
      className={className}
    />
  );
}

export function EmptyImportant({
  className,
  title = "No important tasks",
  description = "Mark tasks as important to see them here",
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Star}
      title={title}
      description={description}
      className={className}
    />
  );
}

export function EmptyPlanned({
  className,
  title = "No planned tasks",
  description = "Add due dates to tasks to see them here",
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Calendar}
      title={title}
      description={description}
      className={className}
    />
  );
}

export function EmptyMyDay({
  className,
  title = "No tasks for today",
  description = "Add tasks to My Day to focus on what matters",
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Sun}
      title={title}
      description={description}
      className={className}
    />
  );
}

export function EmptyList({
  className,
  title = "Empty list",
  description = "Add tasks to this list",
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={List}
      title={title}
      description={description}
      className={className}
    />
  );
}

export function EmptyInbox({
  className,
  title = "All caught up!",
  description = "You have no pending tasks",
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      className={className}
    />
  );
}
