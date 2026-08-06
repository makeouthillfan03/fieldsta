import { cn } from "@/lib/utils";

// Small accent marker used in front of eyebrow labels and list items
// throughout the marketing site -- a CSS border-triangle rather than an
// image/icon so it stays crisp at any size and themes with the accent
// color automatically.
export default function Triangle({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-[var(--accent)]",
        className
      )}
    />
  );
}
