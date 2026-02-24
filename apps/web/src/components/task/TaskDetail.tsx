import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Star, Trash2, Plus, Check, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import { useTaskStore } from "@/stores/taskStore";
import type { Task, Step } from "@/types";
import { cn } from "@/lib/utils";

interface TaskDetailProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const { t } = useTranslation(["tasks", "common"]);
  const { updateTask, deleteTask } = useTaskStore();
  const [title, setTitle] = useState(task?.title || "");
  const [note, setNote] = useState(task?.note || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Step management
  const [newStepTitle, setNewStepTitle] = useState("");
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");

  // My Day management
  const [isInMyDay, setIsInMyDay] = useState(task?.inMyDay || false);
  const [isTogglingMyDay, setIsTogglingMyDay] = useState(false);

  // Sync isInMyDay when task changes
  useEffect(() => {
    if (task) {
      setIsInMyDay(task.inMyDay || false);
    }
  }, [task?.id, task?.inMyDay]);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNote(task.note);
    }
  }, [task?.id]);

  // Auto-save title when blurred
  const handleTitleBlur = async () => {
    if (!task || title === task.title) return;

    setIsSaving(true);
    try {
      interface UpdateTaskResponse {
        success: boolean;
        data: Task;
      }

      const response = (await api.patch<UpdateTaskResponse>(`/tasks/${task.id}`, {
        title: title.trim(),
      })) as unknown as UpdateTaskResponse;

      if (response.success) {
        updateTask(task.id, { title: response.data.title });
      }
    } catch (error) {
      console.error("Failed to update title:", error);
      setTitle(task.title); // Rollback
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save note when blurred
  const handleNoteBlur = async () => {
    if (!task || note === task.note) return;

    setIsSaving(true);
    try {
      interface UpdateTaskResponse {
        success: boolean;
        data: Task;
      }

      const response = (await api.patch<UpdateTaskResponse>(`/tasks/${task.id}`, {
        note: note.trim(),
      })) as unknown as UpdateTaskResponse;

      if (response.success) {
        updateTask(task.id, { note: response.data.note });
      }
    } catch (error) {
      console.error("Failed to update note:", error);
      setNote(task.note); // Rollback
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!task) return;

    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      deleteTask(task.id);
      toast(t("tasks:deleteSuccess") || "Task deleted", "success");
      onClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast(t("tasks:deleteError") || "Failed to delete task", "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleImportant = async () => {
    if (!task) return;

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
      // Rollback
      updateTask(task.id, { isImportant: task.isImportant });
      console.error("Failed to update task:", error);
    }
  };

  // Step management functions
  const handleAddStep = async () => {
    if (!task || !newStepTitle.trim()) return;

    setIsAddingStep(true);
    try {
      interface CreateStepResponse {
        success: boolean;
        data: Step;
      }

      const response = (await api.post<CreateStepResponse>(`/tasks/${task.id}/steps`, {
        title: newStepTitle.trim(),
      })) as unknown as CreateStepResponse;

      if (response.success) {
        const updatedSteps = [...task.steps, response.data];
        updateTask(task.id, { steps: updatedSteps });
        setNewStepTitle("");
      }
    } catch (error) {
      console.error("Failed to add step:", error);
    } finally {
      setIsAddingStep(false);
    }
  };

  const handleToggleStep = async (stepId: string, currentStatus: boolean) => {
    if (!task) return;

    const newStatus = !currentStatus;

    // Optimistic update
    const updatedSteps = task.steps.map((s) =>
      s.id === stepId ? { ...s, isCompleted: newStatus } : s
    );
    updateTask(task.id, { steps: updatedSteps });

    try {
      interface UpdateStepResponse {
        success: boolean;
        data: Step;
      }

      await api.patch<UpdateStepResponse>(`/tasks/${task.id}/steps/${stepId}`, {
        isCompleted: newStatus,
      });
    } catch (error) {
      // Rollback
      const rollbackSteps = task.steps.map((s) =>
        s.id === stepId ? { ...s, isCompleted: currentStatus } : s
      );
      updateTask(task.id, { steps: rollbackSteps });
      console.error("Failed to update step:", error);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!task) return;

    try {
      await api.delete(`/tasks/${task.id}/steps/${stepId}`);
      const updatedSteps = task.steps.filter((s) => s.id !== stepId);
      updateTask(task.id, { steps: updatedSteps });
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  };

  const handleStartEditStep = (step: Step) => {
    setEditingStepId(step.id);
    setEditingStepTitle(step.title);
  };

  const handleSaveStepTitle = async (stepId: string) => {
    if (!task || !editingStepTitle.trim()) return;

    const originalStep = task.steps.find((s) => s.id === stepId);
    if (!originalStep || editingStepTitle.trim() === originalStep.title) {
      setEditingStepId(null);
      return;
    }

    // Optimistic update
    const updatedSteps = task.steps.map((s) =>
      s.id === stepId ? { ...s, title: editingStepTitle.trim() } : s
    );
    updateTask(task.id, { steps: updatedSteps });
    setEditingStepId(null);

    try {
      interface UpdateStepResponse {
        success: boolean;
        data: Step;
      }

      await api.patch<UpdateStepResponse>(`/tasks/${task.id}/steps/${stepId}`, {
        title: editingStepTitle.trim(),
      });
    } catch (error) {
      // Rollback
      const rollbackSteps = task.steps.map((s) =>
        s.id === stepId ? { ...s, title: originalStep.title } : s
      );
      updateTask(task.id, { steps: rollbackSteps });
      console.error("Failed to update step title:", error);
    }
  };

  const handleStepKeyDown = (e: React.KeyboardEvent, stepId?: string) => {
    if (e.key === "Enter") {
      if (stepId) {
        handleSaveStepTitle(stepId);
      } else {
        handleAddStep();
      }
    } else if (e.key === "Escape") {
      if (stepId) {
        setEditingStepId(null);
      }
    }
  };

  const handleToggleMyDay = async () => {
    if (!task) return;

    setIsTogglingMyDay(true);
    const newStatus = !isInMyDay;

    // Optimistic update
    setIsInMyDay(newStatus);
    updateTask(task.id, { inMyDay: newStatus });

    try {
      interface MyDayResponse {
        success: boolean;
        data: unknown;
      }

      if (newStatus) {
        // Add to My Day
        await api.post<MyDayResponse>("/my-day", { taskId: task.id });
      } else {
        // Remove from My Day
        await api.delete<MyDayResponse>(`/my-day/${task.id}`);
      }
    } catch (error) {
      // Rollback
      setIsInMyDay(!newStatus);
      updateTask(task.id, { inMyDay: task.inMyDay });
      console.error("Failed to toggle My Day:", error);
    } finally {
      setIsTogglingMyDay(false);
    }
  };

  if (!task) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          Select a task to view details
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium text-muted-foreground">{t("tasks:detailTitle")}</span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            disabled={isSaving}
            className="font-medium text-lg border-0 px-0 focus-visible:ring-0"
            placeholder="Task title"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className={task.isImportant ? "text-red-500" : ""}
            onClick={handleToggleImportant}
          >
            <Star
              className={`h-4 w-4 mr-1 ${task.isImportant ? "fill-current" : ""}`}
            />
            Important
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={isInMyDay ? "text-amber-500" : ""}
            onClick={handleToggleMyDay}
            disabled={isTogglingMyDay}
          >
            <Sun
              className={`h-4 w-4 mr-1 ${isInMyDay ? "fill-current" : ""}`}
            />
            {isInMyDay ? "In My Day" : "Add to My Day"}
          </Button>
          <DatePicker
            value={task.dueDate}
            onChange={async (date) => {
              // Optimistic update
              updateTask(task.id, { dueDate: date });

              try {
                interface UpdateTaskResponse {
                  success: boolean;
                  data: Task;
                }

                await api.patch<UpdateTaskResponse>(`/tasks/${task.id}`, {
                  dueDate: date,
                });
              } catch (error) {
                // Rollback
                updateTask(task.id, { dueDate: task.dueDate });
                console.error("Failed to update due date:", error);
              }
            }}
            disabled={isSaving}
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            disabled={isSaving}
            className="w-full min-h-[100px] p-3 rounded-md border bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Add a note..."
          />
        </div>

        {/* Steps */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Steps ({task.steps.filter((s) => s.isCompleted).length}/{task.steps.length})
          </label>

          {/* Add Step Input */}
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Add a step..."
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              onKeyDown={(e) => handleStepKeyDown(e)}
              disabled={isAddingStep}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={handleAddStep}
              disabled={!newStepTitle.trim() || isAddingStep}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Steps List */}
          <div className="space-y-1">
            {task.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-accent group"
              >
                <button
                  onClick={() => handleToggleStep(step.id, step.isCompleted)}
                  className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    step.isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground hover:border-primary"
                  )}
                >
                  {step.isCompleted && <Check className="h-3 w-3" />}
                </button>

                {editingStepId === step.id ? (
                  <Input
                    value={editingStepTitle}
                    onChange={(e) => setEditingStepTitle(e.target.value)}
                    onBlur={() => handleSaveStepTitle(step.id)}
                    onKeyDown={(e) => handleStepKeyDown(e, step.id)}
                    autoFocus
                    className="h-7 text-sm py-0"
                  />
                ) : (
                  <>
                    <span
                      className={cn(
                        "flex-1 text-sm cursor-pointer",
                        step.isCompleted && "line-through text-muted-foreground"
                      )}
                      onClick={() => handleStartEditStep(step)}
                    >
                      {step.title}
                    </span>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delete */}
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {isDeleting ? t("common:actions.deleting") || "Deleting..." : t("common:actions.delete")}
          </Button>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t("tasks:deleteConfirmTitle") || "Delete Task"}
        description={t("tasks:deleteConfirmDesc") || "Are you sure you want to delete this task? This action cannot be undone."}
        confirmText={t("common:actions.delete") || "Delete"}
        cancelText={t("common:actions.cancel") || "Cancel"}
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </Card>
  );
}
