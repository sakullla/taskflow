import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, List as ListIcon, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { BatchActionBar } from "@/components/task/BatchActionBar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/user/UserMenu";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("navigation");
  const { currentView, isBatchMode, toggleBatchMode } = useTaskStore();
  const { toggleMobileSidebar } = useUIStore();

  const isSearchPage = location.pathname === "/search";
  const isSettingsPage = location.pathname === "/settings";

  const getTitle = () => {
    switch (currentView) {
      case "myDay":
        return t("myDay");
      case "important":
        return t("important");
      case "planned":
        return t("planned");
      case "all":
        return t("all");
      case "search":
        return t("search");
      default:
        return "TaskFlow";
    }
  };

  const handleSearchClick = () => {
    navigate("/search");
  };

  // Show batch mode button only on task list pages
  const showBatchButton = !isSearchPage && !isSettingsPage;

  return (
    <>
      <BatchActionBar />
      <header className="h-14 border-b bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 lg:px-5 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          {/* Mobile Lists Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 rounded-xl"
            onClick={toggleMobileSidebar}
            aria-label={t("lists")}
          >
            <ListIcon className="h-5 w-5" />
          </Button>

          <h2 className="text-base font-semibold tracking-tight">{getTitle()}</h2>
        </div>

        <div className="flex items-center gap-1">
          {/* Search - Hidden on small mobile */}
          <div className="relative hidden sm:block w-44 lg:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              className="pl-8 h-8 text-sm rounded-xl bg-muted/60 border-0 focus-visible:ring-1 cursor-pointer"
              onClick={handleSearchClick}
              readOnly
              value={isSearchPage ? "" : undefined}
              aria-label={t("search")}
            />
          </div>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-9 w-9 rounded-xl"
            onClick={handleSearchClick}
            aria-label={t("search")}
          >
            <Search className="h-4.5 w-4.5" />
          </Button>

          {showBatchButton && (
            <Button
              variant={isBatchMode ? "secondary" : "ghost"}
              size="icon"
              className="hidden sm:flex h-9 w-9 rounded-xl"
              onClick={toggleBatchMode}
              title={t("batchMode") || "Batch select"}
              aria-label={t("batchMode") || "Batch select"}
              aria-pressed={isBatchMode}
            >
              <CheckSquare className="h-4.5 w-4.5" />
            </Button>
          )}
          <NotificationBell />
          <UserMenu />
        </div>
      </header>
    </>
  );
}
