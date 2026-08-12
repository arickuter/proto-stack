import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "../../cn";

type CardPadding = "none" | "sm" | "md" | "lg";

type CardOwnProps<T extends ElementType> = {
  // Cards are frequently list items, articles or clickable surfaces. `as` lets
  // a call-site render the right element without re-implementing `surface-card`.
  as?: T;
  children: ReactNode;
  hoverable?: boolean;
  padding?: CardPadding;
  className?: string;
};

type CardProps<T extends ElementType> = CardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>;

const paddingClass: Record<CardPadding, string> = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-6 sm:p-7",
  lg: "p-6 sm:p-8 lg:p-10",
};

export default function Card<T extends ElementType = "div">({
  as,
  children,
  hoverable = false,
  padding = "md",
  className,
  ...rest
}: CardProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn(
        "surface-card",
        hoverable && "surface-card-hoverable",
        paddingClass[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
