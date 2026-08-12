import type { ReactNode } from "react";
import { cn } from "../../cn";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type HeadingSize = "display" | "h1" | "h2" | "h3";

interface HeadingProps {
  children: ReactNode;
  as?: HeadingLevel;
  size?: HeadingSize;
  align?: "left" | "center";
  className?: string;
}

const sizeClass: Record<HeadingSize, string> = {
  display: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]",
  h1: "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]",
  h2: "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]",
  h3: "text-lg sm:text-xl font-semibold tracking-tight",
};

export default function Heading({
  children,
  as: As = "h2",
  size = "h2",
  align = "left",
  className,
}: HeadingProps) {
  return (
    <As
      className={cn(
        sizeClass[size],
        align === "center" && "text-center",
        "text-foreground",
        className,
      )}
    >
      {children}
    </As>
  );
}
