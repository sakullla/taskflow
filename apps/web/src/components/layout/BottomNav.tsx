import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sun, Star, Calendar, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Sun, labelKey: "myDay", color: "text-amber-500" },
  { to: "/important", icon: Star, labelKey: "important", color: "text-red-500" },
  { to: "/planned", icon: Calendar, labelKey: "planned", color: "text-green-500" },
  { to: "/tasks", icon: CheckSquare, labelKey: "all", color: "text-blue-500" },
  // Optional: A dedicated lists entry for mobile if needed, 
  // but let's stick to the 4 main ones first for clarity
];

export function BottomNav() {
  const { t } = useTranslation("navigation");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200",
                isActive
                  ? "text-primary translate-y-[-2px]"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5 transition-transform" />
                <span className="text-[10px] font-medium tracking-tight">
                  {t(item.labelKey)}
                </span>
                
                {/* Active Indicator Dot */}
                <div
                  className={cn(
                    "w-1 h-1 rounded-full bg-primary transition-all duration-300",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
