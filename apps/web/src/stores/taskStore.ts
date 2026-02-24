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

  // Batch selection state
  isBatchMode: boolean;
  selectedTaskIds: string[];

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

  // Batch actions
  toggleBatchMode: () => void;
  enterBatchMode: () => void;
  exitBatchMode: () => void;
  toggleTaskSelection: (taskId: string) => void;
  selectTasks: (taskIds: string[]) => void;
  deselectTasks: (taskIds: string[]) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearTaskSelection: () => void;
  batchComplete: () => void;
  batchDelete: () => void;
  batchMoveToList: (listId: string) => void;
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
      isBatchMode: false,
      selectedTaskIds: [],

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
          selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
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

      // Batch actions
      toggleBatchMode: () =>
        set((state) => ({
          isBatchMode: !state.isBatchMode,
          selectedTaskIds: !state.isBatchMode ? [] : state.selectedTaskIds,
          selectedTaskId: null,
        })),

      enterBatchMode: () =>
        set({
          isBatchMode: true,
          selectedTaskId: null,
        }),

      exitBatchMode: () =>
        set({
          isBatchMode: false,
          selectedTaskIds: [],
          selectedTaskId: null,
        }),

      toggleTaskSelection: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.includes(taskId)
            ? state.selectedTaskIds.filter((id) => id !== taskId)
            : [...state.selectedTaskIds, taskId],
        })),

      selectTasks: (taskIds) =>
        set((state) => ({
          selectedTaskIds: [...new Set([...state.selectedTaskIds, ...taskIds])],
        })),

      deselectTasks: (taskIds) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.filter(
            (id) => !taskIds.includes(id)
          ),
        })),

      selectAllTasks: (taskIds) =>
        set({
          selectedTaskIds: taskIds,
        }),

      clearTaskSelection: () =>
        set({
          selectedTaskIds: [],
        }),

      batchComplete: () =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            state.selectedTaskIds.includes(t.id)
              ? { ...t, isCompleted: true }
              : t
          ),
        })),

      batchDelete: () =>
        set((state) => ({
          tasks: state.tasks.filter(
            (t) => !state.selectedTaskIds.includes(t.id)
          ),
          selectedTaskIds: [],
          isBatchMode: false,
        })),

      batchMoveToList: (listId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            state.selectedTaskIds.includes(t.id) ? { ...t, listId } : t
          ),
        })),
    }),
    { name: "task-store" }
  )
);
