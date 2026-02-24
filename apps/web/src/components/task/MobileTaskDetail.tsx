import { motion, AnimatePresence, useAnimation, PanInfo } from "framer-motion";
import { TaskDetail } from "./TaskDetail";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { useEffect } from "react";

export function MobileTaskDetail() {
  const { tasks, selectedTaskId, selectTask } = useTaskStore();
  const { isMobile, isMobileTaskDetailOpen, closeMobileTaskDetail } = useUIStore();
  const controls = useAnimation();

  useEffect(() => {
    if (!selectedTaskId) {
      closeMobileTaskDetail();
    }
  }, [selectedTaskId, closeMobileTaskDetail]);

  useEffect(() => {
    if (isMobile && selectedTaskId) {
      useUIStore.setState({ isMobileTaskDetailOpen: true });
    }
  }, [isMobile, selectedTaskId]);

  useEffect(() => {
    if (isMobileTaskDetailOpen) {
      controls.start("visible");
    }
  }, [isMobileTaskDetailOpen, controls]);

  const task = tasks.find((t) => t.id === selectedTaskId) || null;

  const handleClose = async () => {
    await controls.start("hidden");
    selectTask(null);
    closeMobileTaskDetail();
  };

  const handleDragEnd = async (_e: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      handleClose();
    } else {
      controls.start("visible");
    }
  };

  return (
    <AnimatePresence>
      {isMobile && isMobileTaskDetailOpen && selectedTaskId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={handleDragEnd}
            initial="hidden"
            animate={controls}
            exit="hidden"
            variants={{
              visible: { y: 0 },
              hidden: { y: "100%" },
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 250,
            }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background border-t rounded-t-[2rem] lg:hidden"
            style={{ 
              height: "90dvh",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
            }}
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto px-4 pb-[env(safe-area-inset-bottom)]">
              <TaskDetail task={task} onClose={handleClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
