import { Link } from "react-router";
import type { ReactNode } from "react";
import { cn } from "../../cn";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function NavLink({ href, children, onClick, className }: NavLinkProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center px-2 text-sm font-medium text-muted-foreground transition-colors duration-(--motion-fast) hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
