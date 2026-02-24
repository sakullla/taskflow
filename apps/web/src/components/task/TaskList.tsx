import { TaskItem } from "./TaskItem";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatePresence, motion } from "framer-motion";
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
      <AnimatePresence initial={false} mode="popLayout">
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: 24,
              scale: 0.95,
              filter: "blur(1px)",
              transition: { duration: 0.18, ease: "easeOut" },
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <TaskItem
              task={task}
              isSelected={task.id === selectedId}
              onClick={() => onSelect(task.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
