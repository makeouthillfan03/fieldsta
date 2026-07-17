import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Lightweight checkbox styled to match shadcn/ui, backed by a native
// <input type="checkbox"> for accessibility and form compatibility.
const Checkbox = forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  return (
    <label className={cn("inline-flex items-center", className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="peer sr-only"
        {...props}
      />
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input bg-background transition-colors",
          "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>
    </label>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
