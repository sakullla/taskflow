import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sun, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskSplitList } from "@/components/task/TaskSplitList";
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

    const loadData = async () => {
      try {
        setIsLoading(true);

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
  const completedMyDayTasks = tasks.filter((t) => t.isCompleted);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setIsAdding(true);
    try {
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

        addTask(newTask);

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

  return (
    <div className="flex gap-5 h-full">
      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Page header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-0.5">
            <Sun className="h-5 w-5 text-amber-500" />
            <h1 className="text-xl font-bold">{t("navigation:myDay")}</h1>
          </div>
          <p className="text-xs text-muted-foreground pl-7">{formatDateFull(new Date())}</p>
        </div>

        {/* Add task input */}
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl border border-dashed border-border/80 bg-card/50 hover:border-primary/40 transition-colors focus-within:border-primary/60 focus-within:bg-card">
          <Plus className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          <Input
            placeholder={t("tasks:addPlaceholder")}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 text-sm shadow-none h-auto py-0 placeholder:text-muted-foreground/40"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            disabled={isAdding || isLoading}
            data-testid="quick-add-input"
          />
          {newTaskTitle.trim() && (
            <Button
              size="sm"
              className="shrink-0 h-7 px-3 text-xs rounded-lg"
              onClick={handleAddTask}
              disabled={isAdding || isLoading}
              data-testid="quick-add-submit"
            >
              {t("common:actions.add")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <TaskListSkeleton />
        ) : (
          <TaskSplitList
            incompleteTasks={myDayTasks}
            completedTasks={completedMyDayTasks}
            selectedId={selectedTaskId}
            onSelect={selectTask}
            emptyTitle={t("tasks:emptyMyDayTitle") || "No tasks for today"}
            emptyDescription={t("tasks:emptyMyDayDesc") || "Add tasks to My Day to focus on what matters"}
            emptyIcon={Sun}
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

export default MyDayPage;
