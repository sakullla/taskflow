import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sun, Star, Calendar } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useTaskStore } from "@/stores/taskStore";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function QuickAddOverlay() {
  const { t } = useTranslation(["tasks", "common"]);
  const { isQuickAddOpen, setQuickAddOpen } = useUIStore();
  const { lists, addTask, currentView } = useTaskStore();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickAddOpen) {
      // Small delay to allow animation to start before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isQuickAddOpen]);

  const handleClose = () => {
    setQuickAddOpen(false);
    setTitle("");
  };

  const handleAdd = async () => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const defaultList = lists.find((l) => l.isDefault) || lists[0];
      const payload: any = {
        title: title.trim(),
        listId: defaultList?.id,
      };

      const res: any = await api.post("/tasks", payload);

      if (res.success) {
        const newTask = {
          ...res.data,
          inMyDay: currentView === "myDay",
          steps: [],
        };

        if (currentView === "myDay") {
          await api.post("/my-day", { taskId: newTask.id });
        } else if (currentView === "important") {
          await api.patch(`/tasks/${newTask.id}`, { isImportant: true });
          newTask.isImportant = true;
        }

        addTask(newTask);
        handleClose();
      }
    } catch (error) {
      console.error("Failed to quick add task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isQuickAddOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] lg:hidden"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-card border-t rounded-t-2xl p-4 lg:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {t("tasks:addPlaceholder")}
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative">
                <Input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("tasks:addPlaceholder")}
                  className="pr-12 py-6 text-lg border-primary/20 focus-visible:ring-primary/30"
                />
                <Button
                  size="icon"
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-md transition-all",
                    title.trim() ? "bg-primary opacity-100" : "bg-muted opacity-50"
                  )}
                  onClick={handleAdd}
                  disabled={!title.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Contextual Info (Optional) */}
              <div className="flex gap-4 px-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {currentView === "myDay" && <><Sun className="h-3 w-3 text-amber-500" /> {t("navigation:myDay")}</>}
                  {currentView === "important" && <><Star className="h-3 w-3 text-red-500" /> {t("navigation:important")}</>}
                  {currentView === "planned" && <><Calendar className="h-3 w-3 text-green-500" /> {t("navigation:planned")}</>}
                </div>
              </div>
            </div>
            {/* Pad for safe area */}
            <div className="h-6" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
