import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The design system's `--text-*` scale generates custom `text-*` font-size
// utilities (text-display … text-small). tailwind-merge doesn't know these are
// sizes, so without this it treats `text-display` as a text *colour* and drops
// it as conflicting with `text-foreground` — headings collapse to body size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "h4", "body", "small"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
