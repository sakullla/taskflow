import { useTranslation } from "react-i18next";
import { X, CheckSquare, Trash2, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/stores/taskStore";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useState } from "react";
import { api } from "@/lib/api/client";

export function BatchActionBar() {
  const { t } = useTranslation(["tasks", "common"]);
  const {
    isBatchMode,
    selectedTaskIds,
    lists,
    exitBatchMode,
    clearTaskSelection,
    batchComplete,
    batchDelete,
    updateTask,
  } = useTaskStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedTaskIds.length;

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      // Optimistic update
      batchComplete();

      // API calls
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          api.patch(`/tasks/${taskId}`, { isCompleted: true })
        )
      );

      toast(t("tasks:batchCompleteSuccess") || "Tasks completed", "success");
      exitBatchMode();
    } catch (error) {
      console.error("Failed to complete tasks:", error);
      toast(t("tasks:batchCompleteError") || "Failed to complete tasks", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      // API calls first
      await Promise.all(
        selectedTaskIds.map((taskId) => api.delete(`/tasks/${taskId}`))
      );

      // Then update state
      batchDelete();

      toast(
        t("tasks:batchDeleteSuccess", { count: selectedCount }) ||
          `${selectedCount} tasks deleted`,
        "success"
      );
    } catch (error) {
      console.error("Failed to delete tasks:", error);
      toast(t("tasks:batchDeleteError") || "Failed to delete tasks", "error");
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMoveToList = async (listId: string) => {
    setIsProcessing(true);
    try {
      // Optimistic update
      selectedTaskIds.forEach((taskId) => {
        updateTask(taskId, { listId });
      });

      // API calls
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          api.patch(`/tasks/${taskId}`, { listId })
        )
      );

      toast(t("tasks:batchMoveSuccess") || "Tasks moved", "success");
      exitBatchMode();
    } catch (error) {
      console.error("Failed to move tasks:", error);
      toast(t("tasks:batchMoveError") || "Failed to move tasks", "error");
    } finally {
      setIsProcessing(false);
      setShowMoveDialog(false);
    }
  };

  if (!isBatchMode) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-lg"
        >
          <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-7xl mx-auto">
            {/* Left: Selection info */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={exitBatchMode}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {selectedCount} {t("tasks:selected") || "selected"}
              </span>
              {selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTaskSelection}
                  className="h-7 text-xs"
                >
                  {t("common:actions.clear") || "Clear"}
                </Button>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleComplete}
                disabled={selectedCount === 0 || isProcessing}
                className="hidden sm:flex"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                {t("common:actions.complete") || "Complete"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoveDialog(true)}
                disabled={selectedCount === 0 || isProcessing}
                className="hidden sm:flex"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                {t("common:actions.move") || "Move"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedCount === 0 || isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("common:actions.delete") || "Delete"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Spacer to prevent content from being hidden behind the fixed bar */}
        <div className="h-14" />
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t("tasks:batchDeleteConfirmTitle") || "Delete Tasks"}
        description={
          t("tasks:batchDeleteConfirmDesc", { count: selectedCount }) ||
          `Are you sure you want to delete ${selectedCount} tasks?`
        }
        confirmText={t("common:actions.delete") || "Delete"}
        cancelText={t("common:actions.cancel") || "Cancel"}
        confirmVariant="destructive"
        isLoading={isProcessing}
      />

      {/* Move to List Dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-sm mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">
              {t("tasks:moveToList") || "Move to List"}
            </h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleMoveToList(list.id)}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="flex-1">{list.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                onClick={() => setShowMoveDialog(false)}
                disabled={isProcessing}
              >
                {t("common:actions.cancel") || "Cancel"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
