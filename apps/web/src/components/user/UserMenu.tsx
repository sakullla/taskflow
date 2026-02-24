import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";

export function UserMenu() {
  const { t } = useTranslation(["common", "navigation"]);
  const [isOpen, setIsOpen] = useState(false);
  const { tasks } = useTaskStore();
  const { user, logout } = useAuthStore();

  const displayName = user?.name || t("common:userMenu.defaultName") || "Demo User";
  const displayEmail = user?.email || "demo@example.com";
  const displayAvatar = user?.avatar || null;

  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const totalTasks = tasks.length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("common:userMenu.openMenu") || "Open user menu"}
      >
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
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
              className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl border shadow-lg z-50 overflow-hidden"
            >
              {/* User info */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {displayEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 border-b">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{totalTasks}</p>
                    <p className="text-xs text-muted-foreground">{t("common:userMenu.totalTasks") || "Total Tasks"}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedTasks}</p>
                    <p className="text-xs text-muted-foreground">{t("common:userMenu.completed") || "Completed"}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <Link to="/settings">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t("navigation:settings") || "Settings"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("navigation:logout") || "Logout"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
