/**
 * LoadingSkeleton (issue #18) — task-shaped skeletons that mirror real content
 * layout, so transitioning to loaded state never causes layout shift.
 *
 * Variants:
 *   - card        — generic content card
 *   - list        — n rows of avatar + two text lines
 *   - canvas-mini — small 3-node workflow placeholder
 *   - metrics     — 4 metric cards
 *
 * Respects `prefers-reduced-motion`: shimmer disabled for those users.
 */

import { cn } from "@/lib/utils";

type Variant = "card" | "list" | "canvas-mini" | "metrics";

interface LoadingSkeletonProps {
  variant: Variant;
  /** Repeat the unit (only meaningful for `list`). */
  count?: number;
  className?: string;
}

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/60 motion-safe:animate-pulse",
        className,
      )}
      aria-hidden
    />
  );
}

export function LoadingSkeleton({ variant, count = 3, className }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div role="status" aria-label="Loading" className={cn("space-y-3 p-4 rounded-md border border-border", className)}>
        <Bar className="h-4 w-1/3" />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-5/6" />
        <Bar className="h-3 w-2/3" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <ul role="status" aria-label="Loading list" className={cn("space-y-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Bar className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bar className="h-3 w-1/3" />
              <Bar className="h-3 w-2/3" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "canvas-mini") {
    return (
      <div role="status" aria-label="Loading workflow" className={cn("p-4 rounded-md border border-border bg-muted/20", className)}>
        <div className="flex items-center justify-between gap-3">
          <Bar className="h-12 w-20" />
          <Bar className="h-1 w-8" />
          <Bar className="h-12 w-20" />
          <Bar className="h-1 w-8" />
          <Bar className="h-12 w-20" />
        </div>
      </div>
    );
  }

  if (variant === "metrics") {
    return (
      <div role="status" aria-label="Loading metrics" className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 p-3 rounded-md border border-border">
            <Bar className="h-3 w-1/2" />
            <Bar className="h-6 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
