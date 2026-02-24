import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { List, Plus, List as ListIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/task/TaskList";
import { TaskDetail } from "@/components/task/TaskDetail";
import { MobileTaskDetail } from "@/components/task/MobileTaskDetail";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { api } from "@/lib/api/client";
import type { Task } from "@/types";

export function ListPage() {
  const { listId } = useParams<{ listId: string }>();
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

  const list = lists.find((l) => l.id === listId);

  useEffect(() => {
    if (listId) {
      setCurrentView("list", listId);
    }

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
  }, [listId, setCurrentView, setTasks]);

  const listTasks = tasks.filter((t) => t.listId === listId && !t.isCompleted);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !listId) return;

    setIsAdding(true);
    try {
      interface CreateTaskResponse {
        success: boolean;
        data: Task;
      }

      const response = (await api.post<CreateTaskResponse>("/tasks", {
        title: newTaskTitle.trim(),
        listId: listId,
      })) as unknown as CreateTaskResponse;

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
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: list?.color || "#3b82f6" }}
            >
              <List className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{list?.name || t("lists")}</h1>
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

        <TaskList
          tasks={listTasks}
          selectedId={selectedTaskId}
          onSelect={selectTask}
          emptyTitle={t("tasks:emptyListTitle") || "Empty list"}
          emptyDescription={t("tasks:emptyListDesc") || "Add tasks to this list"}
          emptyIcon={ListIcon}
        />
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
