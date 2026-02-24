import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/task/TaskList";
import { TaskListSkeleton } from "@/components/ui/skeleton";
import { TaskDetail } from "@/components/task/TaskDetail";
import { MobileTaskDetail } from "@/components/task/MobileTaskDetail";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { api } from "@/lib/api/client";
import type { Task } from "@/types";

export function SearchPage() {
  const { t } = useTranslation(["navigation", "tasks", "common"]);
  const { tasks, selectedTaskId, setCurrentView, selectTask } = useTaskStore();
  const { isMobile } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setCurrentView("search");
  }, [setCurrentView]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      interface SearchResponse {
        success: boolean;
        data: Task[];
      }
      const response = (await api.get<SearchResponse>(
        `/tasks/search?search=${encodeURIComponent(query.trim())}`
      )) as unknown as SearchResponse;
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error("Failed to search tasks:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const incompleteResults = searchResults.filter((t) => !t.isCompleted);
  const completedResults = searchResults.filter((t) => t.isCompleted);

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">{t("navigation:search")}</h1>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("tasks:searchPlaceholder") || "Search tasks..."}
                className="pl-9 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {t("tasks:searchPrompt") || "Type to search for tasks"}
            </p>
            <p className="text-sm opacity-60 mt-1">
              {t("tasks:searchDescription") || "Search by task title or notes"}
            </p>
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p>{t("common:loading") || "Searching..."}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {t("tasks:noSearchResults") || "No tasks found"}
            </p>
            <p className="text-sm opacity-60 mt-1">
              {t("tasks:tryDifferentSearch") || "Try a different search term"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {incompleteResults.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                  {t("tasks:tasks")} ({incompleteResults.length})
                </h3>
                {isSearching ? (
                  <TaskListSkeleton />
                ) : (
                  <TaskList
                    tasks={incompleteResults}
                    selectedId={selectedTaskId}
                    onSelect={selectTask}
                  />
                )}
              </div>
            )}
            {completedResults.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                  {t("tasks:completed")} ({completedResults.length})
                </h3>
                {isSearching ? (
                  <TaskListSkeleton />
                ) : (
                  <TaskList
                    tasks={completedResults}
                    selectedId={selectedTaskId}
                    onSelect={selectTask}
                  />
                )}
              </div>
            )}
          </div>
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
