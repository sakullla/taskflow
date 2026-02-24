import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarIcon, X } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const { t, i18n } = useTranslation(["tasks"]);
  const [isOpen, setIsOpen] = useState(false);
  const dateLocale = i18n.resolvedLanguage?.startsWith("zh") ? zhCN : enUS;
  const dateFormat = i18n.resolvedLanguage?.startsWith("zh") ? "M月d日" : "MMM d";
  const presetDates = [
    { label: t("tasks:today") || "Today", getDate: () => new Date() },
    { label: t("tasks:tomorrow") || "Tomorrow", getDate: () => new Date(Date.now() + 86400000) },
    { label: t("tasks:nextWeek") || "Next Week", getDate: () => new Date(Date.now() + 7 * 86400000) },
  ];

  const selectedDate = value ? new Date(value) : null;

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return t("tasks:today") || "Today";
    if (isTomorrow(date)) return t("tasks:tomorrow") || "Tomorrow";
    if (isYesterday(date)) return t("tasks:yesterday") || "Yesterday";
    return format(date, dateFormat, { locale: dateLocale });
  };

  const handleSelectDate = (date: Date) => {
    onChange(date.toISOString());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "gap-2",
          selectedDate && "text-blue-500 border-blue-500/50 bg-blue-500/5"
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        {selectedDate ? formatDateLabel(selectedDate) : t("tasks:dueDate") || "Due Date"}
        {selectedDate && (
          <button
            onClick={handleClear}
            className="ml-1 hover:bg-blue-500/20 rounded-full p-0.5"
            aria-label={t("tasks:removeDueDate") || "Remove due date"}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 z-50 w-56 p-3 bg-popover border rounded-lg shadow-lg">
            <div className="space-y-2">
              {presetDates.map((preset) => {
                const date = preset.getDate();
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectDate(date)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                  >
                    {preset.label}
                    <span className="ml-2 text-xs opacity-60">
                      {format(date, dateFormat, { locale: dateLocale })}
                    </span>
                  </button>
                );
              })}

              <div className="border-t pt-2 mt-2">
                <input
                  type="date"
                  value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSelectDate(new Date(e.target.value));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-md border bg-transparent text-sm"
                />
              </div>

              {selectedDate && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  {t("tasks:removeDueDate") || "Remove Due Date"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
