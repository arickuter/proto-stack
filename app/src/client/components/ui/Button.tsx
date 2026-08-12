import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { cn } from "../../cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "ghost-secondary"
  | "cta"
  | "inverted";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

/*
 * `loading` lives here rather than in a separate LoadingButton so a pending
 * button keeps the variant/size contract. The label stays mounted but hidden
 * so the button does not resize while a request is in flight.
 */
interface ButtonPendingProps {
  loading?: boolean;
  loadingText?: string;
}

type ButtonAsButtonProps = ButtonBaseProps &
  ButtonPendingProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
// `href` renders an internal react-router link. For external links use a plain
// <a> — react-router's Link is for in-app routes.
type ButtonAsLinkProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };
type ButtonElementRest = ButtonPendingProps & ButtonHTMLAttributes<HTMLButtonElement>;

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:pointer-events-none";

/*
 * Buttons are near-black, not green. `--primary` is the green accent used for
 * links and icons; a solid green button would fight the accent for attention
 * on every page. Filled buttons therefore read `--foreground` / `--background`.
 */
const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:bg-foreground/90 rounded-[2px]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-[2px]",
  ghost: "border border-border text-foreground hover:border-foreground/40 rounded-[2px]",
  "ghost-secondary":
    "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground rounded-[2px]",
  cta: "bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-[2px]",
  // Filled button for the dark inverted band: reads the inverted tokens so it
  // stays a light chip on dark ground in both colour schemes.
  inverted:
    "bg-surface-inverted-foreground text-surface-inverted hover:bg-surface-inverted-foreground/90 font-semibold rounded-[2px]",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3 sm:px-7 sm:py-3.5 text-base sm:text-lg",
};

function classes(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
) {
  return cn(base, variantClass[variant], sizeClass[size], fullWidth && "w-full", className);
}

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      children,
      ...rest
    } = props;

    if ("href" in rest && rest.href !== undefined) {
      const { href, ...anchorRest } = rest as ButtonAsLinkProps;
      return (
        <Link
          to={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes(variant, size, fullWidth, className)}
          {...anchorRest}
        >
          {children}
        </Link>
      );
    }

    const { loading = false, loadingText, disabled, ...buttonRest } =
      rest as ButtonElementRest;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes(variant, size, fullWidth, className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...buttonRest}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
        <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
          {loading && loadingText ? loadingText : children}
        </span>
      </button>
    );
  },
);

export default Button;
