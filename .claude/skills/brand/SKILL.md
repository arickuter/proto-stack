---
name: brand
description: Rebrand a proto-stack app from a brief — rewrites the design tokens (both light and dark), swaps fonts, regenerates the palette mirror, and enforces WCAG AA contrast and brand-lint. The default flat "paper" look is the starting preset. Trigger when the user wants to restyle, rebrand, change the colours/fonts/look, "make it feel like <X>", or give the app a distinct visual identity.
---

# /brand — brief → a distinct, correct visual identity

You rewrite the design so the app looks like its own product, while staying
within real UI/UX principles. You edit **token values only** — never token
names (they're the component contract) and never `palette.ts` by hand.

## First, read the rules

Read [`docs/design-principles.md`](../../../docs/design-principles.md) (the
rulebook), [`app/src/client/Main.css`](../../../app/src/client/Main.css) (the
tokens), and [`app/src/brand/brand.config.json`](../../../app/src/brand/brand.config.json).

## Inputs

A brief: app name, audience, 2–3 vibe adjectives, and a colour direction (or
"surprise me"). Ask once for whatever's missing.

## Steps

1. **Propose a direction** in one short paragraph before editing: the accent
   hue and its role, the font pairing, the radius/density personality, and
   whether the flat rules stay. Get a nod.

2. **Rewrite the tokens** in `Main.css` — the `:root` (light) block AND the
   `prefers-color-scheme: dark` block. Values in **oklch**; names untouched.
   Set the `--radius-control` and `--text-*` tokens to match the personality
   (one radius, not two). Keep state tokens (`*-hover`, `*-active`) a step
   toward ink, and status tints as real `--*-surface` / `--*-on-surface` pairs —
   never alpha composites. Follow the principles: one accent hue, 60/30/10,
   `--primary` is not the button colour (unless the brief wants an accent fill).

3. **Fonts** (if changing): pick from [Fontsource](https://fontsource.org),
   `npm install @fontsource/<name>`. Update, in `Main.css`, the `--font-display`
   (headings/wordmark), `--font-sans` (body/UI), and `--font-mono` values; the
   weight imports in `App.tsx` (load only the weights used — a missing weight
   gets synthesised and looks muddy); and `fonts` in `brand.config.json`. The
   `body` rule reads `var(--font-sans)`, so don't hardcode a family anywhere —
   brand-lint fails a `font-family` literal.

4. **Shadows/gradients** (only if the brief truly wants elevation/gradients):
   flip the flag in `brand.config.json` AND remove the `--shadow-*: initial`
   line in `Main.css` — the two must move together (brand-lint checks it).

5. **Regenerate the palette mirror:** `npm run brand:mirror`. Never hand-derive
   hex.

6. **Run the gate:** `npm run check` (brand-lint + security-lint + contrast +
   mirror sync). Iterate token lightness until every contrast pair passes AA and
   brand-lint is clean — including `token-orphan` (a new token you added but
   didn't wire up fails; use it, drop it, or add it to `reservedTokens`). Do not
   eyeball contrast.

7. **Favicon, manifest & og-image:** update `app/public/favicon.svg` (a simple
   letterform on the new palette) and the `background_color` / `theme_color` in
   `site.webmanifest` from the new `palette.ts` values. Also update the
   `theme-color` meta in `main.wasp.ts` head to match `theme_color` (seo-lint
   checks the two agree). Optionally generate `app/public/og-image.png` — a
   1200×630 wordmark on the brand background per [`docs/seo.md`](../../../docs/seo.md);
   if you create it, tell the user `/ship` wires it into the head.

8. **Summarize** old→new (accent, fonts, radius) and suggest a visual pass with
   `wasp start`.

## Guardrails

- **Contrast is the gate, measured not eyeballed.** Never ship a pair
  `npm run contrast` fails.
- **Token names are immutable** — renaming one orphans every call-site.
- **Both themes, always.** Light and dark are both required; dark is not a naive
  invert (lift the accent's lightness so links hold AA).
- **No hex outside `palette.ts`.** One accent hue. Sentence case, no mono-caps
  labels — the anti-tell rules stay on regardless of brand.
- **One radius, real tints, hover toward ink.** Don't add a second radius token,
  don't reach for `bg-*/NN` alpha composites, and keep `*-hover`/`*-active`
  darker on light (lighter on dark) — brand-lint fails all three.
- Don't touch app logic or operations — that's `/prototype`.
