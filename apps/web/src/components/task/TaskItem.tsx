import { Star, Calendar } from "lucide-react";
import { cn, formatDate, isOverdue, isToday } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { useTaskStore } from "@/stores/taskStore";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TaskItem({ task, isSelected, onClick }: TaskItemProps) {
  const { updateTask } = useTaskStore();

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const newStatus = !task.isCompleted;

    // Optimistic update
    updateTask(task.id, { isCompleted: newStatus });

    try {
      interface UpdateTaskResponse {
        success: boolean;
        data: Task;
      }

      await api.patch<UpdateTaskResponse>(`/tasks/${task.id}`, {
        isCompleted: newStatus,
      });
    } catch (error) {
      // Rollback on error
      updateTask(task.id, { isCompleted: task.isCompleted });
      console.error("Failed to update task:", error);
    }
  };

  const handleToggleImportant = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const newStatus = !task.isImportant;

    // Optimistic update
    updateTask(task.id, { isImportant: newStatus });

    try {
      interface UpdateTaskResponse {
        success: boolean;
        data: Task;
      }

      await api.patch<UpdateTaskResponse>(`/tasks/${task.id}`, {
        isImportant: newStatus,
      });
    } catch (error) {
      // Rollback on error
      updateTask(task.id, { isImportant: task.isImportant });
      console.error("Failed to update task:", error);
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50",
        task.isCompleted && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        className={cn(
          "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          task.isCompleted
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground hover:border-primary"
        )}
      >
        {task.isCompleted && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate",
            task.isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                isOverdue(task.dueDate) && "text-destructive",
                isToday(task.dueDate) && "text-amber-500"
              )}
            >
              <Calendar className="h-3 w-3" />
              {isToday(task.dueDate) ? "今天" : formatDate(task.dueDate)}
            </span>
          )}
          {task.steps.length > 0 && (
            <span>
              {task.steps.filter((s) => s.isCompleted).length}/{task.steps.length}
            </span>
          )}
        </div>
      </div>

      {/* Important star */}
      <button
        onClick={handleToggleImportant}
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity",
          task.isImportant && "opacity-100"
        )}
      >
        <Star
          className={cn(
            "h-5 w-5",
            task.isImportant
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground hover:text-red-500"
          )}
        />
      </button>
    </div>
  );
}
