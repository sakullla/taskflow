import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sun, Star, Calendar, CheckSquare, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useTaskStore } from "@/stores/taskStore";
import { api } from "@/lib/api/client";
import type { List } from "@/types";

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
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary">Todo</h1>
      </div>

      <nav className="flex-1 overflow-auto p-3 space-y-1">
        {/* Main Navigation */}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="truncate">{list.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {list.taskCount ? (
                    <span className="text-xs text-muted-foreground">
                      {list.taskCount}
                    </span>
                  ) : null}
                  {!list.isDefault && (
                    <button
                      onClick={(e) => handleDeleteListClick(list.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                      title={t("navigation:delete") || "Delete"}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
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
