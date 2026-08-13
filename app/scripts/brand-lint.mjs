#!/usr/bin/env node
/*
 * brand-lint — design-system invariants, source-level, no network.
 *
 *   node scripts/brand-lint.mjs
 *
 * Reads src/brand/brand.config.json so a /brand rebrand can flip a rule (e.g.
 * allow shadows) declaratively. Every rule here corresponds to a way a page
 * drifts off-system: a raw hex, a stock Tailwind colour, a gradient/shadow the
 * flat design forbids, or a "generated page" typography tell (mono-caps
 * eyebrows, shouty labels). The anti-tell rules are brand-independent quality
 * rules and stay on regardless of the palette.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  walk,
  stripComments,
  Reporter,
  readConfig,
  lineOf,
  lineTextOf,
  splitThemeRegions,
  extractOklchTokens,
} from "./lint-lib.mjs";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP, "src");
const MAIN_CSS = join(APP, "src/client/Main.css");
const cfg = readConfig(APP);
const r = new Reporter(APP);

const allow = new Set((cfg.hexAllowlist ?? []).map((p) => p.replace(/\\/g, "/")));
const allowUppercase = cfg.typography?.allowUppercase ?? [];
const allowMono = cfg.typography?.allowMono ?? [];
const rel = (f) => relative(APP, f).replace(/\\/g, "/");
const inList = (f, list) => list.some((frag) => rel(f).includes(frag));

const files = walk(SRC, [".ts", ".tsx", ".css"]);

const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PROP = "bg|text|border|ring|from|via|to|fill|stroke|divide|outline|decoration|placeholder|caret|accent";

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const src = stripComments(raw);
  const relPath = rel(file);

  // 1. Raw hex colour outside the generated palette mirror.
  if (!allow.has(relPath)) {
    r.scan(file, src, /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/, "no-hex",
      (m) => `raw hex ${m[0]} — use a token, or the palette mirror for non-CSS surfaces`);
  }

  // 2. Raw Tailwind palette colours — tokens only.
  r.scan(file, src, new RegExp(`\\b(${PROP})-(${PALETTE})-\\d{2,3}\\b`), "no-raw-color",
    (m) => `raw Tailwind colour "${m[0]}" — use a semantic token (bg-primary, text-muted-foreground, …)`);

  // 3. Gradients (flat design has none), config-gated.
  if (cfg.gradients === false) {
    r.scan(file, src, /(linear|radial|conic)-gradient\(|\bbg-gradient-to-|\bbg-(linear|radial|conic)\b/, "no-gradient",
      (m) => `gradient "${m[0]}" — the flat palette has none (set brand.config gradients:true to allow)`);
  }

  // 4. Shadows (depth is hairline borders), config-gated.
  if (cfg.shadows === false) {
    r.scan(file, src, /box-shadow\s*:|\bshadow-(sm|md|lg|xl|2xl|inner)\b|\bdrop-shadow-/, "no-shadow",
      (m) => `shadow "${m[0]}" — depth is borders + inverted bands (set brand.config shadows:true to allow)`);
  }

  // 5. Anti-tell: uppercase / tracked-caps, outside the allowlist.
  if (!inList(file, allowUppercase)) {
    r.scan(file, src, /\buppercase\b|text-transform\s*:\s*uppercase/, "no-uppercase",
      "uppercase text — a mono/tracked-caps label reads as a generated page; use sentence case");
  }

  // 6. Anti-tell: font-mono only where functional (counters, code). The escape
  // hatch is per-element, not per-file: mono is allowed on the source line only
  // when that line marks a functional context — a <code>/<kbd>/<samp> element
  // or a [data-counter]. `allowMono` remains a coarse file-level override.
  if (!inList(file, allowMono)) {
    // `(?<!-)` skips the `--font-mono` token definition/reference in Main.css;
    // we only want the Tailwind `font-mono` utility class.
    r.scan(file, src, /(?<!-)\bfont-mono\b/, "mono-functional-only",
      "font-mono outside <code>/<kbd>/<samp>/[data-counter] — mono is for counters/code, never labels",
      (m, text) => /<(?:code|kbd|samp)\b|data-counter/.test(lineTextOf(text, m.index)));
  }

  // 7. Anti-tell: shouty ALL-CAPS runs typed directly into copy. Shares the
  // `no-uppercase` allowlist so a page that genuinely needs adjacent caps (a
  // product name, an acronym pair) has the same escape hatch as rule 5.
  if (!inList(file, allowUppercase)) {
    r.scan(file, src, /\b[A-Z]{2,}(?:\s+[A-Z]{2,}){1,}\b/, "no-shouting",
      (m) => `all-caps run "${m[0].trim()}" — write it in sentence case`);
  }

  // 8. One radius. `rounded-control` is the only radius utility (`rounded-full`
  // stays for genuine circles). Arbitrary `rounded-[…]`, bare `rounded`, and
  // the stock scale are all cleared so the near-square feel can't drift.
  r.scan(file, src, /\brounded[\w-]*-\[[^\]]*\]/, "radius-token-only",
    (m) => `arbitrary radius "${m[0]}" — use rounded-control (the one radius token)`);
  r.scan(file, src, /(?<![\w-])rounded(?![\w-])|\brounded-(?:xs|sm|md|lg|xl|2xl|3xl|none)\b/, "radius-token-only",
    (m) => `"${m[0]}" — stock/bare radii are cleared; use rounded-control`);

  // 9. Font family must reference a --font-* token, never a literal — a font
  // rebrand edits the token, and a stray literal silently outlives it.
  r.scan(file, src, /(?:font-family|fontFamily)\s*:\s*(?![^;,}\n]*var\(--font-)[^;}\n]*["']/, "no-font-literal",
    "font-family literal — set the --font-* token in @theme and reference it with var(--font-…)");

  // 10. No alpha-composited colour utilities in components. A `/NN` tint's
  // rendered colour is not a token, so `npm run contrast` can't grade it — use
  // a real token (e.g. --destructive-surface, --secondary-hover).
  if (!relPath.endsWith(".css")) {
    r.scan(file, src, /\b(?:bg|text|border|outline|ring|fill|stroke|decoration)-[a-z][\w-]*\/\d{1,3}\b/, "no-alpha-composite",
      (m) => `alpha-composited "${m[0]}" — can't be contrast-checked; add a real token (see --destructive-surface)`);
  }
}

// 11. brand.config self-consistency: `flat` is the shorthand the docs use, so it
// must not contradict the depth flags it summarises.
if (cfg.flat === true && (cfg.shadows === true || cfg.gradients === true)) {
  r.add(join(APP, "src/brand/brand.config.json"), 1, "config-flat-drift",
    "brand.config flat:true but shadows/gradients are enabled — a flat brand has neither");
}

// 12. brand.config ↔ Main.css consistency + token canon.
const css = readFileSync(MAIN_CSS, "utf8");

// shadows flag must agree with the `--shadow-*: initial` kill line.
const hasShadowKill = /--shadow-\*\s*:\s*initial/.test(css);
if (cfg.shadows === false && !hasShadowKill) {
  r.add(MAIN_CSS, lineOf(css, 0), "config-css-drift",
    "brand.config shadows:false but Main.css is missing `--shadow-*: initial` (shadows would render)");
}
if (cfg.shadows === true && hasShadowKill) {
  r.add(MAIN_CSS, lineOf(css, css.indexOf("--shadow-*")), "config-css-drift",
    "brand.config shadows:true but Main.css still kills the shadow namespace with `--shadow-*: initial`");
}

// fonts must appear in Main.css.
for (const [key, name] of [["display", cfg.fonts?.display], ["sans", cfg.fonts?.sans], ["mono", cfg.fonts?.mono]]) {
  if (name && !css.includes(name)) {
    r.add(MAIN_CSS, 1, "font-config-drift",
      `brand.config fonts.${key} is "${name}" but Main.css --font-${key} does not reference it`);
  }
}

// Token canon: light `:root` and the dark block must define the same token set,
// and every token a component depends on must be present. A silent rename here
// orphans call-sites like `bg-surface`.
const REQUIRED = [
  "background", "foreground", "foreground-hover", "foreground-active",
  "surface", "surface-elevated",
  "surface-inverted", "surface-inverted-foreground", "surface-inverted-muted", "surface-inverted-foreground-hover",
  "primary", "primary-foreground", "accent",
  "success", "success-foreground", "success-surface", "success-on-surface",
  "warning", "warning-foreground",
  "destructive", "destructive-foreground", "destructive-surface", "destructive-on-surface",
  "secondary", "secondary-foreground", "secondary-hover", "secondary-active",
  "muted", "muted-foreground", "border", "border-hover", "ring",
];
const { light: lightRegion, dark: darkRegion } = splitThemeRegions(css);
const lightTokens = new Set(Object.keys(extractOklchTokens(lightRegion)));
const darkTokens = new Set(Object.keys(extractOklchTokens(darkRegion)));
for (const t of REQUIRED) {
  if (!lightTokens.has(t)) r.add(MAIN_CSS, 1, "token-canon", `required token --${t} missing from :root (light)`);
  if (!darkTokens.has(t)) r.add(MAIN_CSS, 1, "token-canon", `required token --${t} missing from the dark block`);
}
for (const t of lightTokens) {
  if (!darkTokens.has(t)) r.add(MAIN_CSS, 1, "token-canon", `--${t} defined in light but not in the dark block (theme parity)`);
}
for (const t of darkTokens) {
  if (!lightTokens.has(t)) r.add(MAIN_CSS, 1, "token-canon", `--${t} defined in the dark block but not in :root light (theme parity)`);
}

// Token orphans: a colour token defined in `:root` but consumed nowhere is drift
// — the check that would have caught a whole palette of dead tokens. Consumption
// is a Tailwind utility (`bg-<token>`, `text-<token>`, …) or a `var(--token)` in
// a CSS rule. Tokens defined ahead of need live in brand.config `reservedTokens`,
// each still kept honest by a contrast pair. `@theme` alias lines are stripped so
// a token's own `--color-*: var(--token)` mapping never counts as usage.
const reserved = new Set(cfg.reservedTokens ?? []);
const usageHaystack = files
  .map((f) => {
    const text = readFileSync(f, "utf8");
    return f === MAIN_CSS
      ? text.replace(/^\s*--color-[\w-]+:\s*var\(--[\w-]+\);\s*$/gm, "")
      : text;
  })
  .join("\n");
for (const t of lightTokens) {
  if (reserved.has(t)) continue;
  const utility = new RegExp(`\\b(?:${PROP})-${t}(?![\\w-])`);
  if (!utility.test(usageHaystack) && !usageHaystack.includes(`var(--${t})`)) {
    r.add(MAIN_CSS, 1, "token-orphan",
      `--${t} is defined but never consumed — use it, delete it, or add it to reservedTokens`);
  }
}

// 13. One radius token. Besides the `--radius-*: initial` kill line (which
// clears Tailwind's stock scale), exactly one concrete `--radius-<name>` may be
// defined. A second radius (a larger card radius, say) reads as a different
// intention — the design keeps one. See docs/design-principles.md ("Radius is
// personality"). The kill line's `*` isn't a word char, so it never matches.
const radiusTokens = [...css.matchAll(/--radius-([\w-]+):\s*(?!initial)[^;]/g)].map((m) => m[1]);
if (radiusTokens.length !== 1) {
  r.add(MAIN_CSS, lineOf(css, Math.max(0, css.indexOf("--radius-control"))), "single-radius",
    `expected exactly one --radius-<name> token, found ${radiusTokens.length}${radiusTokens.length ? ` (${radiusTokens.join(", ")})` : ""} — the design uses one radius (docs/design-principles.md)`);
}

// 14. Public-asset colours must be palette colours. favicon.svg and
// site.webmanifest can't read a CSS variable, so they hardcode hex — every such
// hex must exist in the palette.ts mirror. This is the check that would have
// caught the shipped drift (manifest #f7fafc vs the palette's #f5f9fc). Fix a
// failure by using a palette value, not by editing palette.ts (it's generated).
const paletteHex = new Set(
  [...readFileSync(join(APP, "src/brand/palette.ts"), "utf8").matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)]
    .map((m) => m[0].toLowerCase()),
);
for (const asset of ["public/site.webmanifest", "public/favicon.svg"]) {
  const p = join(APP, asset);
  if (!existsSync(p)) continue;
  const text = readFileSync(p, "utf8");
  for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    if (!paletteHex.has(m[0].toLowerCase())) {
      r.add(p, lineOf(text, m.index), "public-asset-palette",
        `hex ${m[0]} is not a palette colour — use a value from src/brand/palette.ts (regenerate with npm run brand:mirror after a token change)`);
    }
  }
}

r.finish("brand-lint");
