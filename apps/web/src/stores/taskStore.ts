import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Task, List, ViewType } from "@/types";

interface TaskState {
  // State
  tasks: Task[];
  lists: List[];
  selectedTaskId: string | null;
  currentView: ViewType;
  currentListId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  setLists: (lists: List[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  selectTask: (taskId: string | null) => void;
  setCurrentView: (view: ViewType, listId?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addList: (list: List) => void;
  updateList: (listId: string, updates: Partial<List>) => void;
  deleteList: (listId: string) => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set) => ({
      tasks: [],
      lists: [],
      selectedTaskId: null,
      currentView: "myDay",
      currentListId: null,
      isLoading: false,
      error: null,

      setTasks: (tasks) => set({ tasks }),
      setLists: (lists) => set({ lists }),

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
        })),

      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
        })),

      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
          selectedTaskId:
            state.selectedTaskId === taskId ? null : state.selectedTaskId,
        })),

      selectTask: (taskId) => set({ selectedTaskId: taskId }),

      setCurrentView: (view, listId) =>
        set({ currentView: view, currentListId: listId || null }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      addList: (list) =>
        set((state) => ({
          lists: [...state.lists, list],
        })),

      updateList: (listId, updates) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, ...updates } : l
          ),
        })),

      deleteList: (listId) =>
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
        })),
    }),
    { name: "task-store" }
  )
);
