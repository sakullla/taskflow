import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Calendar, Check, Trash2, Undo } from "lucide-react";
import { cn, formatDate, isOverdue, isToday } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { useTaskStore } from "@/stores/taskStore";
import { motion, useAnimation, useMotionValue, PanInfo } from "framer-motion";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onClick?: () => void;
}

const SWIPE_THRESHOLD = 80;

export function TaskItem({ task, isSelected, onClick }: TaskItemProps) {
  const { t } = useTranslation(["tasks"]);
  const { updateTask, deleteTask, isBatchMode, selectedTaskIds, toggleTaskSelection } =
    useTaskStore();
  const [isCompleting, setIsCompleting] = useState(false);
  const completionTimerRef = useRef<number | null>(null);

  const isBatchSelected = selectedTaskIds.includes(task.id);

  const controls = useAnimation();
  const x = useMotionValue(0);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
      }
    };
  }, []);

  const handleToggleComplete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    const newStatus = !task.isCompleted;

    if (newStatus) {
      // Trigger completion animation
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
      }
      setIsCompleting(true);
      completionTimerRef.current = window.setTimeout(() => {
        setIsCompleting(false);
        completionTimerRef.current = null;
      }, 400);
    }

    // Optimistic update
    updateTask(task.id, { isCompleted: newStatus });

    try {
      await api.patch(`/tasks/${task.id}`, {
        isCompleted: newStatus,
      });
    } catch (error) {
      // Rollback on error
      updateTask(task.id, { isCompleted: task.isCompleted });
      console.error("Failed to update task:", error);
    }
  };

  const handleToggleImportant = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    const newStatus = !task.isImportant;

    // Optimistic update
    updateTask(task.id, { isImportant: newStatus });

    try {
      await api.patch(`/tasks/${task.id}`, {
        isImportant: newStatus,
      });
    } catch (error) {
      // Rollback on error
      updateTask(task.id, { isImportant: task.isImportant });
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async () => {
    // Optimistically remove
    deleteTask(task.id);
    try {
      await api.delete(`/tasks/${task.id}`);
    } catch (error) {
      console.error("Failed to delete task:", error);
      // In a real app we'd roll back here, but for now we'll just log
    }
  };

  const handleBatchSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskSelection(task.id);
  };

  const handleClick = () => {
    if (isBatchMode) {
      toggleTaskSelection(task.id);
    } else {
      onClick?.();
    }
  };

  const handleDragEnd = async (_e: any, info: PanInfo) => {
    if (isBatchMode) {
      controls.start({ x: 0 });
      return;
    }

    const offset = info.offset.x;

    if (offset > SWIPE_THRESHOLD) {
      // Swiped Right -> Complete / Uncomplete
      if (navigator.vibrate) navigator.vibrate(50);
      handleToggleComplete();
    } else if (offset < -SWIPE_THRESHOLD) {
      // Swiped Left -> Delete
      if (navigator.vibrate) navigator.vibrate(50);
      handleDeleteTask();
      return; // Early return so we don't snap back a deleted item
    }
    
    // Animate back to center
    controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
  };

  return (
    <div className="relative overflow-hidden rounded-lg group">
      {/* Background Actions (revealed on swipe) */}
      {!isBatchMode && (
        <div className="absolute inset-0 flex justify-between items-center rounded-lg">
          {/* Left Action (Swipe Right) */}
          <div
            className={cn(
              "flex-1 h-full flex items-center px-4 rounded-l-lg",
              task.isCompleted ? "bg-amber-500 text-white" : "bg-green-500 text-white"
            )}
          >
            {task.isCompleted ? <Undo className="h-6 w-6" /> : <Check className="h-6 w-6" />}
          </div>
          {/* Right Action (Swipe Left) */}
          <div className="flex-1 h-full flex items-center justify-end px-4 bg-destructive text-destructive-foreground rounded-r-lg">
            <Trash2 className="h-6 w-6" />
          </div>
        </div>
      )}

      {/* Draggable Task Card */}
      <motion.div
        drag={!isBatchMode ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        onClick={handleClick}
        className={cn(
          "relative flex items-center gap-3 p-3 lg:p-4 rounded-lg border cursor-pointer transition-all bg-card min-h-[44px]",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          task.isCompleted && "opacity-60",
          isCompleting && "animate-task-complete",
          isBatchMode && isBatchSelected && "border-primary bg-primary/5 ring-1 ring-primary"
        )}
      >
        {/* Batch selection checkbox (shown in batch mode) */}
        {isBatchMode ? (
          <button
            onClick={handleBatchSelect}
            type="button"
            className={cn(
              "w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all duration-200 shrink-0",
              isBatchSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground hover:border-primary"
            )}
            aria-label={task.title}
            aria-pressed={isBatchSelected}
          >
            {isBatchSelected && <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
          </button>
        ) : (
          /* Task completion checkbox (shown in normal mode) */
          <button
            onClick={handleToggleComplete}
            type="button"
            className={cn(
              "w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
              task.isCompleted
                ? "bg-primary border-primary text-primary-foreground scale-110"
                : "border-muted-foreground hover:border-primary hover:scale-105"
            )}
            aria-label={task.isCompleted ? t("tasks:markIncomplete") || "Mark as incomplete" : t("tasks:markCompleted") || "Mark as completed"}
            aria-pressed={task.isCompleted}
          >
            <div
              className={cn(
                "transition-all duration-300",
                task.isCompleted
                  ? "scale-100 opacity-100"
                  : "scale-0 opacity-0"
              )}
            >
              <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 stroke-[3]" />
            </div>
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium truncate transition-all duration-300",
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
                {isToday(task.dueDate) ? t("tasks:today") || "Today" : formatDate(task.dueDate)}
              </span>
            )}
            {task.steps.length > 0 && (
              <span>
                {task.steps.filter((s) => s.isCompleted).length}/{task.steps.length}
              </span>
            )}
          </div>
        </div>

        {/* Important star (hidden in batch mode) */}
        {!isBatchMode && (
          <button
            onClick={handleToggleImportant}
            type="button"
            className={cn(
              "p-2 -m-2 sm:p-0 sm:m-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 shrink-0",
              task.isImportant && "opacity-100 scale-110"
            )}
            aria-label={task.isImportant ? t("tasks:unmarkImportant") || "Unmark as important" : t("tasks:markImportant") || "Mark as important"}        
            aria-pressed={task.isImportant}
          >
            <Star
              className={cn(
                "h-6 w-6 sm:h-5 sm:w-5 transition-all duration-200",
                task.isImportant
                  ? "fill-red-500 text-red-500 scale-110"
                  : "text-muted-foreground hover:text-red-500 hover:scale-110"
              )}
            />
          </button>
        )}
      </motion.div>
    </div>
  );
}
