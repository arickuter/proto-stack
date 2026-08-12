import type { ReactNode } from "react";
import { cn } from "../../cn";

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * The state a list shows when it has no rows yet. A first-class screen, not a
 * line of grey placeholder text — give it a title, one sentence, and a way out.
 */
export default function EmptyState({ title, children, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-control border border-border px-6 py-10 text-center",
        className,
      )}
    >
      <p className="font-medium text-foreground">{title}</p>
      {children && <p className="mt-1 text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
