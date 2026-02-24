import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, Check, CheckCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNotificationStore, type Notification } from "@/stores/notificationStore";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { t } = useTranslation(["common"]);
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications") as unknown as { success: boolean; data: Notification[] };
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, [setNotifications]);

  // Load notifications on mount and keep unread count fresh.
  useEffect(() => {
    void loadNotifications();

    // Poll for new notifications every 10 seconds.
    const interval = setInterval(loadNotifications, 10000);

    const handleRefresh = () => {
      void loadNotifications();
    };
    window.addEventListener("notifications:refresh", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications:refresh", handleRefresh);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (isOpen) {
      void loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleToggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      markAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      markAllAsRead();
      toast(t("common:notifications.markAllSuccess") || "All notifications marked as read", "success");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast(t("common:notifications.markAllError") || "Failed to mark all as read", "error");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast(t("common:notifications.deleteError") || "Failed to delete notification", "error");
    }
  };

  const handleCompleteFromNotification = async (
    notification: Notification,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!notification.taskId) return;

    try {
      await api.patch(`/tasks/${notification.taskId}`, { isCompleted: true });
      await api.patch(`/notifications/${notification.id}/read`);
      markAsRead(notification.id);
      toast(t("common:notifications.taskCompleted") || "Task completed", "success");
      void loadNotifications();
    } catch (error) {
      console.error("Failed to complete task from notification:", error);
      toast(t("common:notifications.completeTaskError") || "Failed to complete task", "error");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("common:notifications.justNow") || "Just now";
    if (minutes < 60) return t("common:notifications.minutesAgo", { count: minutes }) || `${minutes}m ago`;
    if (hours < 24) return t("common:notifications.hoursAgo", { count: hours }) || `${hours}h ago`;
    if (days < 7) return t("common:notifications.daysAgo", { count: days }) || `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleToggleOpen}
        aria-label={t("common:notifications.open") || "Open notifications"}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-primary" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl border shadow-lg z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">{t("common:notifications.title") || "Notifications"}</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                    <Check className="h-4 w-4 mr-1" />
                    {t("common:notifications.markAllRead") || "Mark all read"}
                  </Button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>{t("common:notifications.empty") || "No notifications"}</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors",
                        !notification.isRead && "bg-accent/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {notification.taskId && !notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-primary"
                              onClick={(e) => handleCompleteFromNotification(notification, e)}
                              title={t("common:actions.complete") || "Complete"}
                            >
                              <CheckCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDelete(notification.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
