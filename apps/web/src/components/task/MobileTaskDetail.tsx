import { motion, AnimatePresence } from "framer-motion";
import { TaskDetail } from "./TaskDetail";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { useEffect } from "react";

export function MobileTaskDetail() {
  const { tasks, selectedTaskId, selectTask } = useTaskStore();
  const { isMobile, isMobileTaskDetailOpen, closeMobileTaskDetail } = useUIStore();

  // Close mobile detail when task is deselected
  useEffect(() => {
    if (!selectedTaskId) {
      closeMobileTaskDetail();
    }
  }, [selectedTaskId, closeMobileTaskDetail]);

  // Open mobile detail when task is selected on mobile
  useEffect(() => {
    if (isMobile && selectedTaskId) {
      closeMobileTaskDetail();
      // Small delay to ensure state is updated
      setTimeout(() => {
        useUIStore.setState({ isMobileTaskDetailOpen: true });
      }, 0);
    }
  }, [isMobile, selectedTaskId]);

  const task = tasks.find((t) => t.id === selectedTaskId) || null;

  const handleClose = () => {
    selectTask(null);
    closeMobileTaskDetail();
  };

  return (
    <AnimatePresence>
      {isMobile && isMobileTaskDetailOpen && selectedTaskId && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
          }}
          className="fixed inset-0 z-50 bg-background lg:hidden"
        >
          <div className="h-full overflow-auto">
            <TaskDetail task={task} onClose={handleClose} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
