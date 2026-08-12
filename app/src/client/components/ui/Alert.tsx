import type { ReactNode } from "react";
import { cn } from "../../cn";

/**
 * Inline status message: form errors, submission confirmations. Reads the
 * `*-surface` / `*-on-surface` status tokens (real tokens, not alpha tints) so
 * the text/background pair is contrast-graded and a palette change is one edit.
 */
type AlertVariant = "error" | "success";

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<AlertVariant, string> = {
  error: "border-destructive bg-destructive-surface text-destructive-on-surface",
  success: "border-success bg-success-surface text-success-on-surface",
};

export default function Alert({ variant, children, className }: AlertProps) {
  return (
    <div
      // `alert` is assertive and interrupts a screen reader mid-sentence,
      // which is right for a failure and wrong for a confirmation.
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-control border px-4 py-3 text-sm",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
