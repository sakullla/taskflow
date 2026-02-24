import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Settings, Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("navigation");
  const { currentView } = useTaskStore();
  const { toggleMobileSidebar } = useUIStore();

  const isSearchPage = location.pathname === "/search";

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

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobileSidebar}
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
          />
        </div>

        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={handleSearchClick}
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="h-5 w-5" />
        </Button>
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
