import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TaskList } from "./TaskList";
import { EmptyState } from "@/components/ui/empty-state";
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
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 px-1"
            onClick={() => setIsCompletedExpanded((prev) => !prev)}
          >
            {isCompletedExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {completedTitle} ({completedTasks.length})
          </button>

          {isCompletedExpanded && (
            <TaskList
              tasks={completedTasks}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </div>
      )}
    </div>
  );
}
