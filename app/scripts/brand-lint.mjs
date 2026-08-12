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

import { readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { walk, stripComments, Reporter, readConfig, lineOf } from "./lint-lib.mjs";

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

  // 6. Anti-tell: font-mono only where functional (counters, code).
  if (!inList(file, allowMono)) {
    // `(?<!-)` skips the `--font-mono` token definition/reference in Main.css;
    // we only want the Tailwind `font-mono` utility class.
    r.scan(file, src, /(?<!-)\bfont-mono\b/, "mono-functional-only",
      "font-mono outside the allowlist — mono is for counters/code, never labels");
  }

  // 7. Anti-tell: shouty ALL-CAPS runs typed directly into copy.
  r.scan(file, src, /\b[A-Z]{2,}(?:\s+[A-Z]{2,}){1,}\b/, "no-shouting",
    (m) => `all-caps run "${m[0].trim()}" — write it in sentence case`);
}

// 8. brand.config ↔ Main.css consistency + token canon.
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
for (const [key, name] of [["sans", cfg.fonts?.sans], ["mono", cfg.fonts?.mono]]) {
  if (name && !css.includes(name)) {
    r.add(MAIN_CSS, 1, "font-config-drift",
      `brand.config fonts.${key} is "${name}" but Main.css --font-${key} does not reference it`);
  }
}

// Token canon: light `:root` and the dark block must define the same token set,
// and every token a component depends on must be present. A silent rename here
// orphans call-sites like `bg-surface`.
const REQUIRED = [
  "background", "foreground", "surface", "surface-elevated",
  "surface-inverted", "surface-inverted-foreground", "surface-inverted-muted", "surface-inverted-border",
  "primary", "primary-foreground", "accent", "accent-foreground",
  "success", "success-foreground", "warning", "warning-foreground",
  "destructive", "destructive-foreground", "secondary", "secondary-foreground",
  "muted", "muted-foreground", "border", "ring",
];
const darkIdx = css.search(/@media\s*\(prefers-color-scheme:\s*dark\)/);
const tokensIn = (region) => new Set([...region.matchAll(/--([\w-]+):\s*oklch\(/g)].map((m) => m[1]));
const lightTokens = tokensIn(css.slice(0, darkIdx));
const darkTokens = tokensIn(css.slice(darkIdx));
for (const t of REQUIRED) {
  if (!lightTokens.has(t)) r.add(MAIN_CSS, 1, "token-canon", `required token --${t} missing from :root (light)`);
  if (!darkTokens.has(t)) r.add(MAIN_CSS, 1, "token-canon", `required token --${t} missing from the dark block`);
}
for (const t of lightTokens) {
  if (!darkTokens.has(t)) r.add(MAIN_CSS, 1, "token-canon", `--${t} defined in light but not in the dark block (theme parity)`);
}

r.finish("brand-lint");
