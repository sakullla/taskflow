import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Menu, CheckSquare } from "lucide-react";
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
        return "Todo";
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
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobileSidebar}
          aria-label={t("lists")}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h2 className="text-lg font-semibold">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search - Hidden on small mobile, visible on larger screens */}
        <div className="relative hidden sm:block w-48 lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            className="pl-9 h-9 cursor-pointer"
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
          className="sm:hidden"
          onClick={handleSearchClick}
          aria-label={t("search")}
        >
          <Search className="h-5 w-5" />
        </Button>

        {showBatchButton && (
          <Button
            variant={isBatchMode ? "secondary" : "ghost"}
            size="icon"
            className="hidden sm:flex"
            onClick={toggleBatchMode}
            title={t("batchMode") || "Batch select"}
            aria-label={t("batchMode") || "Batch select"}
            aria-pressed={isBatchMode}
          >
            <CheckSquare className="h-5 w-5" />
          </Button>
        )}
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
    </>
  );
}
