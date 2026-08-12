import type { ReactNode } from "react";
import { cn } from "../../cn";

type SectionTone = "default" | "muted" | "fill" | "inverted";
type SectionDensity = "default" | "compact";

interface SectionProps {
  children: ReactNode;
  tone?: SectionTone;
  density?: SectionDensity;
  id?: string;
  className?: string;
}

const toneClass: Record<SectionTone, string> = {
  default: "bg-background",
  muted: "bg-muted",
  // A flat fill one step off the page — the palette has no gradients.
  fill: "bg-secondary",
  // Dark band. `.surface-inverted` also recolours nested headings.
  inverted: "surface-inverted",
};

const densityClass: Record<SectionDensity, string> = {
  default: "py-16 md:py-24",
  compact: "py-10 md:py-14",
};

export default function Section({
  children,
  tone = "default",
  density = "default",
  id,
  className,
}: SectionProps) {
  return (
    <section id={id} className={cn(toneClass[tone], densityClass[density], className)}>
      {children}
    </section>
  );
}
