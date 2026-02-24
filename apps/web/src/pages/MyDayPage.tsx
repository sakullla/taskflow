import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sun, Plus, Sun as SunIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/task/TaskList";
import { TaskDetail } from "@/components/task/TaskDetail";
import { MobileTaskDetail } from "@/components/task/MobileTaskDetail";
import { TaskListSkeleton } from "@/components/ui/skeleton";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { api } from "@/lib/api/client";
import { formatDateFull } from "@/lib/utils";

export function MyDayPage() {
  const { t } = useTranslation(["tasks", "navigation", "common"]);
  const {
    tasks,
    lists,
    selectedTaskId,
    setCurrentView,
    setTasks,
    setLists,
    addTask,
    selectTask,
  } = useTaskStore();
  const { isMobile } = useUIStore();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentView("myDay");

    // Load lists and tasks from API
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load lists
        interface ListsResponse {
          success: boolean;
          data: Array<{
            id: string;
            name: string;
            color: string;
            isDefault: boolean;
            isArchived: boolean;
            order: number;
            userId: string;
            taskCount?: number;
            createdAt: string;
            updatedAt: string;
          }>;
        }

        const listsRes = (await api.get<ListsResponse>("/lists")) as unknown as ListsResponse;
        if (listsRes.success) {
          setLists(listsRes.data);
        }

        // Load My Day tasks
        interface MyDayResponse {
          success: boolean;
          data: {
            date: string;
            tasks: Array<{
              id: string;
              title: string;
              note: string;
              isCompleted: boolean;
              isImportant: boolean;
              inMyDay?: boolean;
              dueDate: string | null;
              reminderAt: string | null;
              priority: "low" | "normal" | "high";
              order: number;
              listId: string;
              list?: {
                id: string;
                name: string;
                color: string;
              };
              steps: Array<{
                id: string;
                title: string;
                isCompleted: boolean;
                order: number;
                taskId?: string;
                createdAt?: string;
                updatedAt?: string;
              }>;
              createdAt: string;
              updatedAt: string;
            }>;
            count: number;
          };
        }

        const myDayRes = (await api.get<MyDayResponse>("/my-day")) as unknown as MyDayResponse;
        if (myDayRes.success) {
          setTasks(myDayRes.data.tasks.map(task => ({
            ...task,
            inMyDay: true,
            steps: task.steps.map(s => ({
              ...s,
              taskId: s.taskId || task.id,
              createdAt: s.createdAt || task.createdAt,
              updatedAt: s.updatedAt || task.updatedAt,
            })),
          })));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [setCurrentView, setTasks, setLists]);

  const myDayTasks = tasks.filter((t) => !t.isCompleted);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsAdding(true);
    try {
      // Get default list ID if available
      const defaultList = lists.find((l) => l.isDefault) || lists[0];

      interface CreateTaskResponse {
        success: boolean;
        data: {
          id: string;
          title: string;
          note: string;
          isCompleted: boolean;
          isImportant: boolean;
          dueDate: string | null;
          reminderAt: string | null;
          priority: "low" | "normal" | "high";
          order: number;
          listId: string;
          steps: Array<{
            id: string;
            title: string;
            isCompleted: boolean;
            order: number;
          }>;
          createdAt: string;
          updatedAt: string;
        };
      }

      const payload: { title: string; listId?: string } = {
        title: newTaskTitle.trim(),
      };

      // Only add listId if we have a valid one
      if (defaultList?.id) {
        payload.listId = defaultList.id;
      }

      const response = (await api.post<CreateTaskResponse>("/tasks", payload)) as unknown as CreateTaskResponse;

      if (response.success) {
        const newTask = {
          ...response.data,
          inMyDay: true,
          steps: (response.data.steps || []).map((s) => ({
            ...s,
            taskId: response.data.id,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          })),
        };

        // Add task to store
        addTask(newTask);

        // Also add to My Day
        try {
          await api.post("/my-day", { taskId: newTask.id });
        } catch (error) {
          console.error("Failed to add to My Day:", error);
        }

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
            <Sun className="h-8 w-8 text-amber-500" />
            <h1 className="text-2xl font-bold">{t("navigation:myDay")}</h1>
          </div>
          <p className="text-muted-foreground">{formatDateFull(new Date())}</p>
        </div>

        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Input
                placeholder={t("tasks:addPlaceholder")}
                className="border-0 focus-visible:ring-0"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
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
            tasks={myDayTasks}
            selectedId={selectedTaskId}
            onSelect={selectTask}
            emptyTitle={t("tasks:emptyMyDayTitle") || "No tasks for today"}
            emptyDescription={t("tasks:emptyMyDayDesc") || "Add tasks to My Day to focus on what matters"}
            emptyIcon={SunIcon}
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

export default MyDayPage;
