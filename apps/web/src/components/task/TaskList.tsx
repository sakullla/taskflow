import { CheckCircle2, ClipboardList } from "lucide-react";
import { TaskItem } from "./TaskItem";
import type { Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  emptyIcon?: "check" | "clipboard";
}

export function TaskList({ tasks, selectedId, onSelect, emptyMessage, emptyIcon = "clipboard" }: TaskListProps) {
  if (tasks.length === 0) {
    const Icon = emptyIcon === "check" ? CheckCircle2 : ClipboardList;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Icon className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-sm">{emptyMessage || "No tasks"}</p>
      </div>
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
