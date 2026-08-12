import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../cn";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full min-h-11 rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
          className,
        )}
        {...rest}
      />
    );
  },
);

export default Input;
