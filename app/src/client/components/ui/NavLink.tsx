import { Link } from "react-router";
import type { ReactNode } from "react";
import { cn } from "../../cn";

type NavLinkVariant = "default" | "mobile";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  variant?: NavLinkVariant;
  onClick?: () => void;
  className?: string;
}

const variantClass: Record<NavLinkVariant, string> = {
  default: "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
  mobile:
    "block w-full rounded-[2px] px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
};

export default function NavLink({
  href,
  children,
  variant = "default",
  onClick,
  className,
}: NavLinkProps) {
  return (
    <Link to={href} onClick={onClick} className={cn(variantClass[variant], className)}>
      {children}
    </Link>
  );
}
