/**
 * EmptyState (issue #18) — single component for every "nothing here yet" surface.
 *
 * Conventions:
 *   - icon, title, body, optional CTA
 *   - body and CTA are optional; only title + icon required
 *   - reduced-motion respected (no entrance animation if user prefers)
 */

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
  /** Visual size — `sm` for in-panel, `md` for full-page. */
  size?: "sm" | "md";
  className?: string;
}

export function EmptyState({ icon: Icon, title, body, cta, size = "md", className }: EmptyStateProps) {
  const isSmall = size === "sm";
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isSmall ? "py-8 px-4 gap-2" : "py-16 px-6 gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center",
          isSmall ? "h-10 w-10" : "h-14 w-14",
        )}
        aria-hidden
      >
        <Icon className={isSmall ? "h-5 w-5 text-muted-foreground" : "h-7 w-7 text-muted-foreground"} />
      </div>
      <h3 className={cn("font-semibold tracking-tight", isSmall ? "text-sm" : "text-base")}>{title}</h3>
      {body && (
        <p className={cn("text-muted-foreground max-w-sm", isSmall ? "text-xs" : "text-sm")}>{body}</p>
      )}
      {cta && (
        <Button onClick={cta.onClick} className="mt-2" size={isSmall ? "sm" : "default"}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}
