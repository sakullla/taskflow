import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Plus, Star as StarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

export function ImportantPage() {
  const { t } = useTranslation(["navigation", "tasks", "common"]);
  const {
    tasks,
    lists,
    selectedTaskId,
    setCurrentView,
    setTasks,
    addTask,
    selectTask,
  } = useTaskStore();
  const { isMobile } = useUIStore();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentView("important");

    const loadTasks = async () => {
      try {
        setIsLoading(true);
        interface TasksResponse {
          success: boolean;
          data: Task[];
        }
        const response = (await api.get<TasksResponse>("/tasks?isImportant=true")) as unknown as TasksResponse;
        if (response.success) {
          setTasks(response.data);
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTasks();
  }, [setCurrentView, setTasks]);

  const importantTasks = tasks.filter((t) => t.isImportant && !t.isCompleted);
  const completedImportantTasks = tasks.filter((t) => t.isImportant && t.isCompleted);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsAdding(true);
    try {
      interface CreateTaskResponse {
        success: boolean;
        data: Task;
      }

      const defaultList = lists.find((l) => l.isDefault) || lists[0];
      const payload: { title: string; isImportant: boolean; listId?: string } = {
        title: newTaskTitle.trim(),
        isImportant: true,
      };

      if (defaultList?.id) {
        payload.listId = defaultList.id;
      }

      const response = (await api.post<CreateTaskResponse>("/tasks", payload)) as unknown as CreateTaskResponse;

      if (response.success) {
        addTask(response.data);
        setNewTaskTitle("");
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">{t("important")}</h1>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder={t("tasks:addPlaceholder")}
                className="flex-1 border-0 focus-visible:ring-0"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAdding || isLoading}
              />
              <Button
                size="sm"
                className="shrink-0"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || isAdding || isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("common:actions.add")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <TaskListSkeleton />
        ) : (
          <TaskSplitList
            incompleteTasks={importantTasks}
            completedTasks={completedImportantTasks}
            selectedId={selectedTaskId}
            onSelect={selectTask}
            emptyTitle={t("tasks:emptyImportantTitle") || "No important tasks"}
            emptyDescription={t("tasks:emptyImportantDesc") || "Mark tasks as important to see them here"}
            emptyIcon={StarIcon}
            completedTitle={t("tasks:completed") || "Completed"}
            noPendingText={t("common:empty.noPending") || "No pending tasks"}
          />
        )}
      </div>

      {/* Desktop Task Detail */}
      {!isMobile && selectedTaskId && (
        <div className="w-96 animate-slide-in hidden lg:block">
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

export default ImportantPage;
