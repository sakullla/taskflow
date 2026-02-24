import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TaskList } from "./TaskList";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import type { LucideIcon } from "lucide-react";

interface TaskSplitListProps {
  incompleteTasks: Task[];
  completedTasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  completedTitle?: string;
  noPendingText?: string;
  defaultExpanded?: boolean;
}

export function TaskSplitList({
  incompleteTasks,
  completedTasks,
  selectedId,
  onSelect,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  completedTitle = "Completed",
  noPendingText = "No pending tasks",
  defaultExpanded = false,
}: TaskSplitListProps) {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(defaultExpanded);

  if (incompleteTasks.length === 0 && completedTasks.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle || "No tasks"}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-4">
      {incompleteTasks.length > 0 ? (
        <TaskList
          tasks={incompleteTasks}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ) : (
        <p className="text-sm text-muted-foreground px-1">{noPendingText}</p>
      )}

      {completedTasks.length > 0 && (
        <div className="rounded-lg border bg-card">
          <button
            type="button"
            className={cn(
              "w-full px-3 py-2 flex items-center justify-between text-sm font-medium hover:bg-accent/50 transition-colors",
              isCompletedExpanded && "border-b"
            )}
            onClick={() => setIsCompletedExpanded((prev) => !prev)}
          >
            <span>
              {completedTitle} ({completedTasks.length})
            </span>
            {isCompletedExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isCompletedExpanded && (
            <div className="p-2">
              <TaskList
                tasks={completedTasks}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
