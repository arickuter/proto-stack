import type { ReactNode } from "react";
import { cn } from "../../cn";

/**
 * Inline status message: form errors, submission confirmations. Reads
 * `--destructive` / `--success` so both light and dark are handled by the
 * token layer and a palette change is one edit rather than a grep.
 */
type AlertVariant = "error" | "success";

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<AlertVariant, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  // `--success` deliberately shares the brand green, so the text stays
  // `--foreground`: green-on-green-tint fails contrast.
  success: "border-success/30 bg-success/10 text-foreground",
};

export default function Alert({ variant, children, className }: AlertProps) {
  return (
    <div
      // `alert` is assertive and interrupts a screen reader mid-sentence,
      // which is right for a failure and wrong for a confirmation.
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[2px] border px-4 py-3 text-sm",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
