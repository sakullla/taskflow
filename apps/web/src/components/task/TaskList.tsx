import { TaskItem } from "./TaskItem";
import { EmptyState } from "@/components/ui/empty-state";
import type { Task } from "@/types";
import type { LucideIcon } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
}

export function TaskList({
  tasks,
  selectedId,
  onSelect,
  emptyTitle,
  emptyDescription,
  emptyIcon,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle || "No tasks"}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isSelected={task.id === selectedId}
          onClick={() => onSelect(task.id)}
        />
      ))}
    </div>
  );
}
