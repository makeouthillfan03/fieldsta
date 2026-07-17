import { cn } from "@/lib/utils";

// Minimal dependency-free modal used for delete confirmations, etc.
function Dialog({ open, onClose, children, className }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 w-full sm:max-w-md rounded-t-lg sm:rounded-lg bg-background border border-border p-4 shadow-lg",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { Dialog };
