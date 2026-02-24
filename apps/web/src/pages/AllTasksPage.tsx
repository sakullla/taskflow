import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckSquare, Plus, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/task/TaskList";
import { TaskListSkeleton } from "@/components/ui/skeleton";
import { TaskDetail } from "@/components/task/TaskDetail";
import { MobileTaskDetail } from "@/components/task/MobileTaskDetail";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { api } from "@/lib/api/client";
import type { Task } from "@/types";

export function AllTasksPage() {
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
    setCurrentView("all");

    const loadTasks = async () => {
      try {
        setIsLoading(true);
        interface TasksResponse {
          success: boolean;
          data: Task[];
        }
        const response = (await api.get<TasksResponse>("/tasks")) as unknown as TasksResponse;
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

  const incompleteTasks = tasks.filter((t) => !t.isCompleted);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsAdding(true);
    try {
      interface CreateTaskResponse {
        success: boolean;
        data: Task;
      }

      const defaultList = lists.find((l) => l.isDefault) || lists[0];
      const payload: { title: string; listId?: string } = {
        title: newTaskTitle.trim(),
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

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold">{t("all")}</h1>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Input
                placeholder={t("tasks:addPlaceholder")}
                className="border-0 focus-visible:ring-0"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                disabled={isAdding || isLoading}
              />
              <Button
                size="sm"
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
          <TaskList
            tasks={incompleteTasks}
            selectedId={selectedTaskId}
            onSelect={selectTask}
            emptyTitle={t("tasks:emptyAllTitle") || "No tasks"}
            emptyDescription={t("tasks:emptyAllDesc") || "Start by adding your first task!"}
            emptyIcon={ClipboardList}
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

export default AllTasksPage;
