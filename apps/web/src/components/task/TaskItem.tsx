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

const SWIPE_THRESHOLD = 120;

export function TaskItem({ task, isSelected, onClick }: TaskItemProps) {
  const { t } = useTranslation(["tasks"]);
  const { updateTask, deleteTask, isBatchMode, selectedTaskIds, toggleTaskSelection } =
    useTaskStore();
  const [isCompleting, setIsCompleting] = useState(false);
  const [dragDir, setDragDir] = useState<"left" | "right" | null>(null);
  const completionTimerRef = useRef<number | null>(null);

  const isBatchSelected = selectedTaskIds.includes(task.id);

  const controls = useAnimation();
  const x = useMotionValue(0);

  useEffect(() => {
    const unsubscribe = x.on("change", (val) => {
      if (val > 20) setDragDir("right");
      else if (val < -20) setDragDir("left");
      else setDragDir(null);
    });
    return unsubscribe;
  }, [x]);

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
      if (completionTimerRef.current !== null) window.clearTimeout(completionTimerRef.current);
      setIsCompleting(true);
      completionTimerRef.current = window.setTimeout(() => {
        setIsCompleting(false);
        completionTimerRef.current = null;
      }, 400);
    }
    updateTask(task.id, { isCompleted: newStatus });
    try {
      await api.patch(`/tasks/${task.id}`, { isCompleted: newStatus });
    } catch {
      updateTask(task.id, { isCompleted: task.isCompleted });
    }
  };

  const handleToggleImportant = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newStatus = !task.isImportant;
    updateTask(task.id, { isImportant: newStatus });
    try {
      await api.patch(`/tasks/${task.id}`, { isImportant: newStatus });
    } catch {
      updateTask(task.id, { isImportant: task.isImportant });
    }
  };

  const handleDeleteTask = async () => {
    deleteTask(task.id);
    try {
      await api.delete(`/tasks/${task.id}`);
    } catch {
      // silent
    }
  };

  const handleBatchSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskSelection(task.id);
  };

  const handleClick = () => {
    if (isBatchMode) toggleTaskSelection(task.id);
    else onClick?.();
  };

  const handleDragEnd = async (_e: unknown, info: PanInfo) => {
    setDragDir(null);
    if (isBatchMode) { controls.start({ x: 0 }); return; }
    const offset = info.offset.x;
    if (offset > SWIPE_THRESHOLD) {
      if (navigator.vibrate) navigator.vibrate(50);
      handleToggleComplete();
    } else if (offset < -SWIPE_THRESHOLD) {
      if (navigator.vibrate) navigator.vibrate(50);
      handleDeleteTask();
      return;
    }
    controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
  };

  const dueDateOverdue = task.dueDate && isOverdue(task.dueDate);
  const dueDateToday = task.dueDate && isToday(task.dueDate);

  return (
    <div className="relative overflow-hidden rounded-xl group">
      {/* Background swipe actions — only visible while dragging */}
      {!isBatchMode && dragDir && (
        <div className="absolute inset-0 flex justify-between items-stretch rounded-xl pointer-events-none">
          <div className={cn(
            "flex items-center px-5 transition-opacity duration-150",
            dragDir === "right"
              ? (task.isCompleted ? "bg-amber-500 text-white flex-1" : "bg-emerald-500 text-white flex-1")
              : "flex-1 opacity-0"
          )}>
            {dragDir === "right" && (task.isCompleted ? <Undo className="h-5 w-5" /> : <Check className="h-5 w-5" />)}
          </div>
          <div className={cn(
            "flex items-center justify-end px-5 transition-opacity duration-150",
            dragDir === "left" ? "bg-destructive text-destructive-foreground flex-1" : "flex-1 opacity-0"
          )}>
            {dragDir === "left" && <Trash2 className="h-5 w-5" />}
          </div>
        </div>
      )}

      {/* Draggable card */}
      <motion.div
        drag={!isBatchMode ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        onClick={handleClick}
        className={cn(
          "relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer select-none",
          "transition-all duration-150 bg-card shadow-sm border",
          isSelected
            ? "border-primary/40 shadow-primary/10 shadow-md bg-primary/[0.02]"
            : "border-transparent hover:border-border/50 hover:shadow-md",
          task.isCompleted && "opacity-50",
          isCompleting && "animate-task-complete",
          isBatchMode && isBatchSelected && "border-primary/40 shadow-primary/10 shadow-md"
        )}
      >
        {/* Batch checkbox */}
        {isBatchMode ? (
          <button
            onClick={handleBatchSelect}
            type="button"
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",              isBatchSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
            )}
            aria-label={task.title}
            aria-pressed={isBatchSelected}
          >
            {isBatchSelected && <Check className="w-3 h-3 stroke-[3]" />}
          </button>
        ) : (
          <button
            onClick={handleToggleComplete}
            type="button"
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0",
              task.isCompleted
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/50 hover:border-primary"
            )}
            aria-label={task.isCompleted ? t("tasks:markIncomplete") || "Mark incomplete" : t("tasks:markCompleted") || "Mark complete"}
            aria-pressed={task.isCompleted}
          >
            <Check className={cn(
              "w-3 h-3 stroke-[3] transition-all duration-200",
              task.isCompleted ? "opacity-100 scale-100" : "opacity-0 scale-0"
            )} />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium leading-snug",
            task.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
          )}>
            {task.title}
          </p>
          {(task.dueDate || task.steps.length > 0) && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {task.dueDate && (
                <span className={cn(
                  "flex items-center gap-1",
                  dueDateOverdue ? "text-destructive" : dueDateToday ? "text-amber-500" : ""
                )}>
                  <Calendar className="h-3 w-3" />
                  {dueDateToday ? t("tasks:today") || "Today" : formatDate(task.dueDate)}
                </span>
              )}
              {task.steps.length > 0 && (
                <span>{task.steps.filter(s => s.isCompleted).length}/{task.steps.length} steps</span>
              )}
            </div>
          )}
        </div>

        {/* Star */}
        {!isBatchMode && (
          <button
            onClick={handleToggleImportant}
            type="button"
            className={cn(
              "p-1 rounded-md transition-all duration-150 shrink-0",
              "sm:opacity-0 sm:group-hover:opacity-100",
              task.isImportant && "sm:opacity-100"
            )}
            aria-label={task.isImportant ? t("tasks:unmarkImportant") || "Unmark important" : t("tasks:markImportant") || "Mark important"}
            aria-pressed={task.isImportant}
          >
            <Star className={cn(
              "h-4 w-4 transition-all duration-150",
              task.isImportant ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 hover:text-amber-400"
            )} />
          </button>
        )}
      </motion.div>
    </div>
  );
}
