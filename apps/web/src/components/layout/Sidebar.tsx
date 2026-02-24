import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sun, Star, Calendar, CheckSquare, Plus, Trash2, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useTaskStore } from "@/stores/taskStore";
import { api } from "@/lib/api/client";
import type { List } from "@/types";

const mainNavItems = [
  { to: "/", icon: Sun, labelKey: "myDay", color: "text-amber-500", bg: "bg-amber-500/10" },
  { to: "/important", icon: Star, labelKey: "important", color: "text-red-500", bg: "bg-red-500/10" },
  { to: "/planned", icon: Calendar, labelKey: "planned", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { to: "/tasks", icon: CheckSquare, labelKey: "all", color: "text-blue-500", bg: "bg-blue-500/10" },
];

const LIST_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export function Sidebar() {
  const { t } = useTranslation(["navigation", "common"]);
  const { lists, addList, deleteList } = useTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LIST_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteListClick = (listId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setListToDelete(listId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteList = async () => {
    if (!listToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/lists/${listToDelete}`);
      deleteList(listToDelete);
    } catch (error) {
      console.error("Failed to delete list:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setListToDelete(null);
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
    <aside className="w-64 border-r bg-card flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <ListTodo className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">TaskFlow</span>
      </div>

      <nav className="flex-1 overflow-auto py-3 px-3 space-y-0.5">
        {/* Main Navigation */}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "h-4 w-4 transition-colors shrink-0",
                  isActive ? "text-primary-foreground" : item.color
                )} />
                <span className="flex-1">{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="my-3 border-t" />

        {/* Lists Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {t("lists")}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg hover:bg-accent"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
              aria-label={`${t("common:actions.add") || "Add"} ${t("lists")}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Add List Form */}
          {isAdding && (
            <div className="px-1 mb-3 space-y-2">
              <Input
                placeholder={t("newListPlaceholder") || "List name"}
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                autoFocus
                className="h-8 text-sm rounded-lg"
              />
              <div className="flex gap-1.5 flex-wrap px-1">
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
              <div className="flex gap-2 px-1">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs rounded-lg"
                  onClick={handleCreateList}
                  disabled={!newListName.trim() || isSubmitting}
                >
                  {t("create") || "Create"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs rounded-lg"
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

          <div className="space-y-0.5">
            {lists.map((list) => (
              <NavLink
                key={list.id}
                to={`/lists/${list.id}`}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: list.color }}
                    />
                    <span className="flex-1 truncate">{list.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {list.taskCount ? (
                        <span className={cn(
                          "text-xs tabular-nums",
                          isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {list.taskCount}
                        </span>
                      ) : null}
                      {!list.isDefault && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteListClick(list.id, e)}
                          className={cn(
                            "opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all",
                            isActive
                              ? "hover:bg-white/20 text-primary-foreground"
                              : "hover:bg-destructive/10 hover:text-destructive"
                          )}
                          title={t("navigation:delete") || "Delete"}
                          aria-label={`${t("navigation:delete") || "Delete"} ${list.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Delete List Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeleteList}
        title={t("navigation:deleteListConfirmTitle") || "Delete List"}
        description={t("navigation:deleteListConfirmDesc") || "Are you sure you want to delete this list? Tasks in this list will be moved to the default list."}
        confirmText={t("common:actions.delete") || "Delete"}
        cancelText={t("common:actions.cancel") || "Cancel"}
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </aside>
  );
}
