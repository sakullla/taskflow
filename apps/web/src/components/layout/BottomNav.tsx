import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sun, Star, Calendar, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Sun, labelKey: "myDay", color: "text-amber-500" },
  { to: "/important", icon: Star, labelKey: "important", color: "text-red-500" },
  { to: "/planned", icon: Calendar, labelKey: "planned", color: "text-emerald-500" },
  { to: "/tasks", icon: CheckSquare, labelKey: "all", color: "text-blue-500" },
];

export function BottomNav() {
  const { t } = useTranslation("navigation");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200 relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive ? "bg-primary/10" : ""
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "text-primary" : item.color + " opacity-60"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive ? "text-primary" : ""
                )}>
                  {t(item.labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
