import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Calendar as CalendarIcon, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskSplitList } from "@/components/task/TaskSplitList";
import { TaskListSkeleton } from "@/components/ui/skeleton";
import { TaskDetail } from "@/components/task/TaskDetail";
import { MobileTaskDetail } from "@/components/task/MobileTaskDetail";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { api } from "@/lib/api/client";
import type { Task } from "@/types";

export function PlannedPage() {
  const { t } = useTranslation(["navigation", "tasks", "common"]);
  const {
    tasks,
    lists,
    selectedTaskId,
    setCurrentView,
    mergeTasks,
    addTask,
    selectTask,
  } = useTaskStore();
  const { isMobile } = useUIStore();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentView("planned");

    const loadTasks = async () => {
      try {
        setIsLoading(true);
        interface TasksResponse {
          success: boolean;
          data: Task[];
        }
        // Load all tasks, filter client-side for planned
        const response = (await api.get<TasksResponse>("/tasks")) as unknown as TasksResponse;
        if (response.success) {
          mergeTasks(response.data);
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTasks();
  }, [setCurrentView, mergeTasks]);

  const plannedTasks = tasks.filter((t) => t.dueDate && !t.isCompleted);
  const completedPlannedTasks = tasks.filter((t) => t.dueDate && t.isCompleted);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsAdding(true);
    try {
      interface CreateTaskResponse {
        success: boolean;
        data: Task;
      }

      const defaultList = lists.find((l) => l.isDefault) || lists[0];
      const payload: { title: string; dueDate: string; listId?: string } = {
        title: newTaskTitle.trim(),
        dueDate: new Date().toISOString(),
      };

      if (defaultList?.id) {
        payload.listId = defaultList.id;
      }

      const response = (await api.post<CreateTaskResponse>("/tasks", payload)) as unknown as CreateTaskResponse;

      if (response.success) {
        addTask(response.data);
        setNewTaskTitle("");
        window.dispatchEvent(new Event("notifications:refresh"));
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex gap-5 h-full">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-0.5">
            <Calendar className="h-5 w-5 text-emerald-500" />
            <h1 className="text-xl font-bold">{t("planned")}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2 px-4 py-3 rounded-xl bg-card shadow-sm border border-transparent hover:border-border/50 hover:shadow-md transition-all duration-150 focus-within:border-primary/40 focus-within:shadow-md">
          <PenLine className="h-4 w-4 text-muted-foreground/40 shrink-0" />

          <Input
            placeholder={t("tasks:addPlaceholder")}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 text-sm shadow-none h-8 py-0 placeholder:text-muted-foreground/40"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            disabled={isAdding || isLoading}
          />
          {newTaskTitle.trim() && (
            <Button
              size="sm"
              className="shrink-0 h-7 px-3 text-xs rounded-lg"
              onClick={handleAddTask}
              disabled={isAdding || isLoading}
            >
              {t("common:actions.add")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <TaskListSkeleton />
        ) : (
          <TaskSplitList
            incompleteTasks={plannedTasks}
            completedTasks={completedPlannedTasks}
            selectedId={selectedTaskId}
            onSelect={selectTask}
            emptyTitle={t("tasks:emptyPlannedTitle") || "No planned tasks"}
            emptyDescription={t("tasks:emptyPlannedDesc") || "Add due dates to tasks to see them here"}
            emptyIcon={CalendarIcon}
            completedTitle={t("tasks:completed") || "Completed"}
            noPendingText={t("common:empty.noPending") || "No pending tasks"}
          />
        )}
      </div>

      {/* Desktop Task Detail */}
      {!isMobile && selectedTaskId && (
        <div className="w-80 xl:w-96 animate-slide-in hidden lg:flex flex-col bg-card border rounded-2xl p-5 shadow-sm shrink-0 self-start sticky top-6">
          <TaskDetail
            task={tasks.find((t) => t.id === selectedTaskId) || null}
            onClose={() => selectTask(null)}
          />
        </div>
      )}

      {/* Mobile Task Detail */}
      <MobileTaskDetail />
    </div>
  );
}

export default PlannedPage;
