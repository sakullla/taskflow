import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Star, Calendar, CheckSquare, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { api } from "@/lib/api/client";
import type { List } from "@/types";
import { useState } from "react";

const mainNavItems = [
  { to: "/", icon: Sun, labelKey: "myDay", color: "text-amber-500" },
  { to: "/important", icon: Star, labelKey: "important", color: "text-red-500" },
  { to: "/planned", icon: Calendar, labelKey: "planned", color: "text-green-500" },
  { to: "/tasks", icon: CheckSquare, labelKey: "all", color: "text-blue-500" },
];

const LIST_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export function MobileSidebar() {
  const { t } = useTranslation(["navigation", "common"]);
  const location = useLocation();
  const { lists, addList, deleteList } = useTaskStore();
  const { isMobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LIST_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when route changes
  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        closeMobileSidebar();
      }
    };

    if (isMobileSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileSidebarOpen, closeMobileSidebar]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    setIsSubmitting(true);
    try {
      interface CreateListResponse {
        success: boolean;
        data: List;
      }

      const response = (await api.post<CreateListResponse>("/lists", {
        name: newListName.trim(),
        color: selectedColor,
      })) as unknown as CreateListResponse;

      if (response.success) {
        addList(response.data);
        setNewListName("");
        setSelectedColor(LIST_COLORS[0]);
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Failed to create list:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteList = async (listId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(t("deleteListConfirm") || "Delete this list?")) return;

    try {
      await api.delete(`/lists/${listId}`);
      deleteList(listId);
    } catch (error) {
      console.error("Failed to delete list:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateList();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewListName("");
    }
  };

  return (
    <AnimatePresence>
      {isMobileSidebarOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeMobileSidebar}
          />

          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed inset-y-0 left-0 w-72 bg-card border-r z-50 flex flex-col lg:hidden"
          >
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Todo</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileSidebar}
            aria-label={t("common:actions.close") || "Close"}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-auto p-3 space-y-1">
          {/* Main Navigation */}
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className={cn("h-5 w-5", item.color)} />
              {t(item.labelKey)}
            </NavLink>
          ))}

          {/* Lists Section */}
          <div className="pt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("lists")}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsAdding(true)}
                disabled={isAdding}
                aria-label={`${t("create") || "Create"} ${t("lists")}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Add List Form */}
            {isAdding && (
              <div className="px-3 mb-3 space-y-2">
                <Input
                  placeholder={t("newListPlaceholder") || "List name"}
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitting}
                  autoFocus
                  className="h-8 text-sm"
                />
                <div className="flex gap-1 flex-wrap">
                  {LIST_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-5 h-5 rounded-full transition-all",
                        selectedColor === color && "ring-2 ring-offset-1 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={color}
                      aria-pressed={selectedColor === color}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || isSubmitting}
                  >
                    {t("create") || "Create"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setIsAdding(false);
                      setNewListName("");
                    }}
                    disabled={isSubmitting}
                  >
                    {t("cancel") || "Cancel"}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {lists.map((list) => (
                <NavLink
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors group",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: list.color }}
                      />
                    </div>
                    <span className="truncate">{list.isDefault ? (t("navigation:defaultList") || list.name) : list.name}</span>
                  </div>
                  <div className="ml-2 shrink-0 flex items-center gap-1">
                    {list.taskCount ? (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {list.taskCount}
                      </span>
                    ) : null}
                    {!list.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteList(list.id, e)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50 transition-colors"
                        title={t("delete") || "Delete"}
                        aria-label={`${t("delete") || "Delete"} ${list.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
