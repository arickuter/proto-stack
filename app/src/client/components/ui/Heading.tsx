import type { ReactNode } from "react";
import { cn } from "../../cn";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type HeadingSize = "display" | "h1" | "h2" | "h3" | "h4";

interface HeadingProps {
  children: ReactNode;
  as?: HeadingLevel;
  size?: HeadingSize;
  align?: "left" | "center";
  className?: string;
}

// Each `text-*` token carries its own size, line-height and letter-spacing
// (fluid, defined in Main.css). The display face comes from the global h1–h6
// rule, so only the weight is set here.
const sizeClass: Record<HeadingSize, string> = {
  display: "text-display font-bold",
  h1: "text-h1 font-bold",
  h2: "text-h2 font-bold",
  h3: "text-h3 font-semibold",
  h4: "text-h4 font-semibold",
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
