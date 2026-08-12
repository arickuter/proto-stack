import { cn } from "../../cn";

interface SkeletonProps {
  lines?: number;
  className?: string;
}

/**
 * Loading placeholder for a query in flight. `aria-hidden` so a screen reader
 * skips the bars; pair it with an `aria-busy` region if you need an announced
 * loading state. The pulse goes static under prefers-reduced-motion.
 */
export default function Skeleton({ lines = 3, className }: SkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 animate-pulse rounded-control bg-muted",
            i === lines - 1 && "w-2/3",
          )}
        />
      ))}
    </div>
  );
}
