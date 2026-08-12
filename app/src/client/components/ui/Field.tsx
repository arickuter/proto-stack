import type { ReactNode } from "react";
import { cn } from "../../cn";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Label + control + optional error, wired for screen readers. Pass the error
 * message and set `aria-invalid` / `aria-describedby={`${htmlFor}-error`}` on
 * the control so the message is announced.
 */
export default function Field({ label, htmlFor, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
