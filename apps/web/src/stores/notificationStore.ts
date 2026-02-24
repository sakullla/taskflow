import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "task_reminder" | "task_due" | "system";
  isRead: boolean;
  taskId?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter(n => !n.isRead).length
        }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        })),

      markAsRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.isRead) {
            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          }
          return state;
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      deleteNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.isRead
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        }),

      setUnreadCount: (count) => set({ unreadCount: count }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: "notification-store" }
  )
);
