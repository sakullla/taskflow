import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        className={cn(
          "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
          className
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
