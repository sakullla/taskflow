import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Star, Trash2, Plus, Check, Sun, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [newStepTitle, setNewStepTitle] = useState("");
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");

  const [isInMyDay, setIsInMyDay] = useState(task?.inMyDay || false);
  const [isTogglingMyDay, setIsTogglingMyDay] = useState(false);

  const refreshNotifications = () => {
    window.dispatchEvent(new Event("notifications:refresh"));
  };

  useEffect(() => {
    if (task) setIsInMyDay(task.inMyDay || false);
  }, [task?.id, task?.inMyDay]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNote(task.note);
    }
  }, [task?.id]);

  const handleTitleBlur = async () => {
    if (!task || title === task.title) return;
    setIsSaving(true);
    try {
      interface UpdateTaskResponse { success: boolean; data: Task; }
      const response = (await api.patch<UpdateTaskResponse>(`/tasks/${task.id}`, { title: title.trim() })) as unknown as UpdateTaskResponse;
      if (response.success) updateTask(task.id, { title: response.data.title });
    } catch {
      setTitle(task.title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNoteBlur = async () => {
    if (!task || note === task.note) return;
    setIsSaving(true);
    try {
      interface UpdateTaskResponse { success: boolean; data: Task; }
      const response = (await api.patch<UpdateTaskResponse>(`/tasks/${task.id}`, { note: note.trim() })) as unknown as UpdateTaskResponse;
      if (response.success) updateTask(task.id, { note: response.data.note });
    } catch {
      setNote(task.note);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      deleteTask(task.id);
      toast(t("tasks:deleteSuccess") || "Task deleted", "success");
      onClose();
    } catch {
      toast(t("tasks:deleteError") || "Failed to delete task", "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleImportant = async () => {
    if (!task) return;
    const newStatus = !task.isImportant;
    updateTask(task.id, { isImportant: newStatus });
    try {
      await api.patch(`/tasks/${task.id}`, { isImportant: newStatus });
    } catch {
      updateTask(task.id, { isImportant: task.isImportant });
    }
  };

  const handleToggleMyDay = async () => {
    if (!task) return;
    setIsTogglingMyDay(true);
    const newStatus = !isInMyDay;
    setIsInMyDay(newStatus);
    updateTask(task.id, { inMyDay: newStatus });
    try {
      if (newStatus) await api.post("/my-day", { taskId: task.id });
      else await api.delete(`/my-day/${task.id}`);
    } catch {
      setIsInMyDay(!newStatus);
      updateTask(task.id, { inMyDay: task.inMyDay });
    } finally {
      setIsTogglingMyDay(false);
    }
  };

  const handleAddStep = async () => {
    if (!task || !newStepTitle.trim()) return;
    setIsAddingStep(true);
    try {
      interface CreateStepResponse { success: boolean; data: Step; }
      const response = (await api.post<CreateStepResponse>(`/tasks/${task.id}/steps`, { title: newStepTitle.trim() })) as unknown as CreateStepResponse;
      if (response.success) {
        updateTask(task.id, { steps: [...task.steps, response.data] });
        setNewStepTitle("");
      }
    } catch { /* silent */ } finally {
      setIsAddingStep(false);
    }
  };

  const handleToggleStep = async (stepId: string, currentStatus: boolean) => {
    if (!task) return;
    const newStatus = !currentStatus;
    updateTask(task.id, { steps: task.steps.map(s => s.id === stepId ? { ...s, isCompleted: newStatus } : s) });
    try {
      await api.patch(`/tasks/${task.id}/steps/${stepId}`, { isCompleted: newStatus });
    } catch {
      updateTask(task.id, { steps: task.steps.map(s => s.id === stepId ? { ...s, isCompleted: currentStatus } : s) });
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!task) return;
    try {
      await api.delete(`/tasks/${task.id}/steps/${stepId}`);
      updateTask(task.id, { steps: task.steps.filter(s => s.id !== stepId) });
    } catch { /* silent */ }
  };

  const handleStartEditStep = (step: Step) => {
    setEditingStepId(step.id);
    setEditingStepTitle(step.title);
  };

  const handleSaveStepTitle = async (stepId: string) => {
    if (!task || !editingStepTitle.trim()) return;
    const originalStep = task.steps.find(s => s.id === stepId);
    if (!originalStep || editingStepTitle.trim() === originalStep.title) { setEditingStepId(null); return; }
    updateTask(task.id, { steps: task.steps.map(s => s.id === stepId ? { ...s, title: editingStepTitle.trim() } : s) });
    setEditingStepId(null);
    try {
      await api.patch(`/tasks/${task.id}/steps/${stepId}`, { title: editingStepTitle.trim() });
    } catch {
      updateTask(task.id, { steps: task.steps.map(s => s.id === stepId ? { ...s, title: originalStep.title } : s) });
    }
  };

  const handleStepKeyDown = (e: React.KeyboardEvent, stepId?: string) => {
    if (e.key === "Enter") { stepId ? handleSaveStepTitle(stepId) : handleAddStep(); }
    else if (e.key === "Escape" && stepId) setEditingStepId(null);
  };

  if (!task) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Calendar className="h-6 w-6 opacity-40" />
        </div>
        <p className="text-sm">{t("tasks:selectTaskPrompt") || "Select a task"}</p>
      </div>
    );
  }

  const completedSteps = (task.steps || []).filter(s => s.isCompleted).length;
  const totalSteps = (task.steps || []).length;

  return (
    <div className="flex flex-col">
      {/* Close button */}
      <div className="flex justify-end shrink-0 mb-1 -mr-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)] space-y-3 pr-0.5">
        {/* Title */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          disabled={isSaving}
          className="font-semibold text-[15px] border-0 px-0 focus-visible:ring-0 bg-transparent h-auto py-0 shadow-none"
          placeholder={t("tasks:titleLabel") || "Task title"}
        />

        {/* Action row — icon buttons */}
        <div className="flex items-center gap-1 border rounded-xl px-2 py-1.5">
          {/* Important */}
          <button
            type="button"
            onClick={handleToggleImportant}
            title={task.isImportant ? t("tasks:unmarkImportant") || "Unmark important" : t("tasks:markImportant") || "Mark important"}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              task.isImportant ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
            )}
          >
            <Star className={cn("h-4 w-4", task.isImportant && "fill-current")} />
          </button>

          {/* My Day */}
          <button
            type="button"
            onClick={handleToggleMyDay}
            disabled={isTogglingMyDay}
            title={isInMyDay ? t("tasks:inMyDay") || "In My Day" : t("tasks:addToMyDay") || "Add to My Day"}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isInMyDay ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
            )}
          >
            <Sun className={cn("h-4 w-4", isInMyDay && "fill-current")} />
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Due date */}
          <DatePicker
            value={task.dueDate}
            onChange={async (date) => {
              updateTask(task.id, { dueDate: date });
              try {
                await api.patch(`/tasks/${task.id}`, { dueDate: date });
                refreshNotifications();
              } catch {
                updateTask(task.id, { dueDate: task.dueDate });
              }
            }}
            disabled={isSaving}
          />
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          disabled={isSaving}
          rows={3}
          className="w-full p-2.5 rounded-xl border bg-muted/20 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-border transition-all placeholder:text-muted-foreground/40"
          placeholder={t("tasks:notePlaceholder") || "Add a note..."}
        />

        {/* Steps */}
        <div className="space-y-1.5">
          {/* Progress header */}
          {totalSteps > 0 && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                {completedSteps}/{totalSteps}
              </span>
            </div>
          )}

          {/* Step list */}
          {(task.steps || []).map((step) => (
            <div key={step.id} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-accent/50 group transition-colors">
              <button
                onClick={() => handleToggleStep(step.id, step.isCompleted)}
                className={cn(
                  "w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors shrink-0",
                  step.isCompleted ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary"
                )}
              >
                {step.isCompleted && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </button>

              {editingStepId === step.id ? (
                <Input
                  value={editingStepTitle}
                  onChange={(e) => setEditingStepTitle(e.target.value)}
                  onBlur={() => handleSaveStepTitle(step.id)}
                  onKeyDown={(e) => handleStepKeyDown(e, step.id)}
                  autoFocus
                  className="h-6 text-sm py-0 flex-1 shadow-none"
                />
              ) : (
                <>
                  <span
                    className={cn("flex-1 text-sm cursor-pointer leading-snug", step.isCompleted && "line-through text-muted-foreground")}
                    onClick={() => handleStartEditStep(step)}
                  >
                    {step.title}
                  </span>
                  <button
                    onClick={() => handleDeleteStep(step.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Add step */}
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="w-[18px] h-[18px] rounded border-2 border-dashed border-muted-foreground/25 shrink-0" />
            <Input
              placeholder={t("tasks:stepPlaceholder") || "Add a step..."}
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              onKeyDown={(e) => handleStepKeyDown(e)}
              disabled={isAddingStep}
              className="h-6 flex-1 text-sm border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/40 py-0"
              data-testid="step-add-input"
            />
            {newStepTitle.trim() && (
              <button
                type="button"
                onClick={handleAddStep}
                disabled={isAddingStep}
                className="p-0.5 rounded text-primary hover:bg-primary/10 transition-colors"
                data-testid="step-add-submit"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete button */}
      <div className="pt-3 mt-1 border-t shrink-0">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-muted-foreground/60 hover:text-destructive transition-colors rounded-lg hover:bg-destructive/5 outline-none"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? t("common:actions.deleting") || "Deleting..." : t("common:actions.delete")}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t("tasks:deleteConfirmTitle") || "Delete Task"}
        description={t("tasks:deleteConfirmDesc") || "Are you sure? This cannot be undone."}
        confirmText={t("common:actions.delete") || "Delete"}
        cancelText={t("common:actions.cancel") || "Cancel"}
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
