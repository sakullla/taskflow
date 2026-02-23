import { useTranslation } from "react-i18next";
import { Search, Settings, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/stores/taskStore";

export function Header() {
  const { t } = useTranslation("navigation");
  const { currentView } = useTaskStore();

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
      default:
        return "Todo";
    }
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold">{getTitle()}</h2>

      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            className="pl-9 h-9"
          />
        </div>

        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
