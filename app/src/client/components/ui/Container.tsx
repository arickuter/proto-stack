import type { ElementType, ReactNode } from "react";
import { cn } from "../../cn";

type ContainerWidth = "narrow" | "default" | "wide";

interface ContainerProps {
  children: ReactNode;
  width?: ContainerWidth;
  as?: ElementType;
  className?: string;
}

const widthClass: Record<ContainerWidth, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

export default function Container({
  children,
  width = "default",
  as: As = "div",
  className,
}: ContainerProps) {
  return (
    <As className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widthClass[width], className)}>
      {children}
    </As>
  );
}
