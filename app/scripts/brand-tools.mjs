#!/usr/bin/env node
/*
 * brand-tools — the colour engine for the design system.
 *
 *   node scripts/brand-tools.mjs contrast   # WCAG-check every token pair (both themes)
 *   node scripts/brand-tools.mjs mirror      # regenerate src/brand/palette.ts from Main.css
 *
 * Main.css (the oklch tokens) is the single source of truth. `mirror` derives
 * the sRGB hex mirror from it — never hand-edit palette.ts. `contrast` fails
 * the build if any required pair drops below its WCAG threshold, so a rebrand
 * cannot ship an unreadable palette. Both read the same parser, so they never
 * disagree about what the tokens are.
 *
 * Dependency-free on purpose: runs as a plain Node script. The oklch -> sRGB
 * math is validated against known conversions in the /brand skill's checks.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const MAIN_CSS = join(APP, "src/client/Main.css");
const PALETTE_TS = join(APP, "src/brand/palette.ts");

// ---------------------------------------------------------------------------
// oklch -> sRGB
// ---------------------------------------------------------------------------

function oklchToLinearSrgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const clamp01 = (c) => Math.min(Math.max(c, 0), 1);

function linearToSrgbChannel(c) {
  const cl = clamp01(c);
  return cl <= 0.0031308 ? 12.92 * cl : 1.055 * cl ** (1 / 2.4) - 0.055;
}

function oklchToHex(L, C, H) {
  const lin = oklchToLinearSrgb(L, C, H);
  const bytes = lin.map((c) => Math.round(linearToSrgbChannel(c) * 255));
  return "#" + bytes.map((v) => v.toString(16).padStart(2, "0")).join("");
}

// WCAG relative luminance. The clamped linear-light RGB is exactly what WCAG's
// channel linearisation produces, so we use it directly (clamping models the
// out-of-gamut colour the display would actually show).
function oklchToLuminance(L, C, H) {
  const [r, g, b] = oklchToLinearSrgb(L, C, H).map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isInGamut(L, C, H) {
  return oklchToLinearSrgb(L, C, H).every((c) => c >= -0.0005 && c <= 1.0005);
}

function contrastRatio(tokenA, tokenB) {
  const la = oklchToLuminance(tokenA.L, tokenA.C, tokenA.H);
  const lb = oklchToLuminance(tokenB.L, tokenB.C, tokenB.H);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------------------------------------------------------------------------
// Parse the oklch tokens out of Main.css
// ---------------------------------------------------------------------------

function parseOklch(value) {
  // e.g. "oklch(45% 0.16 142)" -> { L: 0.45, C: 0.16, H: 142 }
  const inner = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")"));
  const parts = inner.trim().split(/[\s,]+/);
  const L = parts[0].endsWith("%") ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
  const C = parseFloat(parts[1] ?? "0");
  const H = parseFloat(parts[2] ?? "0");
  return { L, C, H };
}

function extractTokens(region) {
  const tokens = {};
  const re = /--([\w-]+):\s*(oklch\([^)]*\))\s*;/g;
  let m;
  while ((m = re.exec(region))) tokens[m[1]] = parseOklch(m[2]);
  return tokens;
}

/**
 * Splits Main.css into the light `:root` region and the dark
 * `@media (prefers-color-scheme: dark)` region and extracts oklch tokens from
 * each. Non-oklch declarations (`@theme` var() refs, radii, utilities) are
 * ignored by the regex.
 */
function parseThemes() {
  const css = readFileSync(MAIN_CSS, "utf8");
  const darkIdx = css.search(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  if (darkIdx === -1) {
    throw new Error("Main.css: could not find the dark @media block.");
  }
  const light = extractTokens(css.slice(0, darkIdx));
  const dark = extractTokens(css.slice(darkIdx));
  return { light, dark };
}

// ---------------------------------------------------------------------------
// Contrast pairs. Each is [foreground token, background token, min ratio].
// Every pair maps to real UI: text on a surface, a link, a filled control, a
// decorative mark. If you rename a token, update these names too.
// ---------------------------------------------------------------------------

const PAIRS = [
  ["foreground", "background", 4.5, "body text on page"],
  ["muted-foreground", "background", 4.5, "secondary text on page"],
  ["muted-foreground", "muted", 4.5, "secondary text on muted section"],
  ["secondary-foreground", "secondary", 4.5, "text on secondary fill"],
  ["primary", "background", 4.5, "link / accent text on page"],
  ["primary-foreground", "primary", 4.5, "text on primary fill"],
  ["background", "foreground", 4.5, "filled button (bg=foreground, text=background)"],
  ["destructive", "background", 4.5, "error text on page"],
  ["warning-foreground", "warning", 4.5, "text on warning fill"],
  ["surface-inverted-foreground", "surface-inverted", 4.5, "text on dark band"],
  ["surface-inverted-muted", "surface-inverted", 4.5, "muted text on dark band"],
  ["accent", "surface-inverted", 3.0, "decorative mark on dark band"],
];

function runContrast() {
  const themes = parseThemes();
  let failures = 0;
  let gamutWarnings = 0;

  for (const themeName of ["light", "dark"]) {
    const tokens = themes[themeName];
    console.log(`\n${themeName} theme`);
    for (const [fg, bg, min, label] of PAIRS) {
      const a = tokens[fg];
      const b = tokens[bg];
      if (!a || !b) {
        console.log(`  MISSING  ${fg} / ${bg} — token not found (must be an oklch value)`);
        failures++;
        continue;
      }
      const ratio = contrastRatio(a, b);
      const ok = ratio >= min;
      if (!ok) failures++;
      const mark = ok ? "PASS" : "FAIL";
      console.log(
        `  ${mark}  ${ratio.toFixed(2).padStart(5)} : ${min.toFixed(1)}  ${fg} / ${bg}  (${label})`,
      );
    }
    for (const [name, t] of Object.entries(tokens)) {
      if (!isInGamut(t.L, t.C, t.H)) {
        console.log(`  GAMUT  --${name} is outside sRGB; it will be clamped when displayed.`);
        gamutWarnings++;
      }
    }
  }

  console.log("");
  if (failures > 0) {
    console.error(`✗ contrast: ${failures} pair(s) below threshold.`);
    process.exit(1);
  }
  console.log(`✓ contrast: all pairs pass AA${gamutWarnings ? ` (${gamutWarnings} gamut warning(s))` : ""}.`);
}

// ---------------------------------------------------------------------------
// Mirror: regenerate palette.ts from the tokens
// ---------------------------------------------------------------------------

function toCamel(kebab) {
  return kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function renderThemeObject(name, tokens) {
  const lines = Object.entries(tokens).map(([token, { L, C, H }]) => {
    const hex = oklchToHex(L, C, H);
    return `  ${toCamel(token)}: "${hex}", // --${token}`;
  });
  return `export const ${name} = {\n${lines.join("\n")}\n} as const;`;
}

function runMirror() {
  const { light, dark } = parseThemes();
  const header = `/*
 * GENERATED FILE — do not edit by hand.
 *
 * sRGB hex mirror of the oklch design tokens in src/client/Main.css, for the
 * surfaces that cannot read a CSS custom property (favicon/manifest colours,
 * OG images, transactional email, any canvas/SVG rasteriser).
 *
 * Regenerate with:  npm run brand:mirror
 * Main.css is the source of truth; this file is derived from it.
 */
`;
  const body = [
    header,
    "/** Light theme — :root in Main.css. */",
    renderThemeObject("PALETTE_LIGHT", light),
    "",
    "/** Dark theme — the prefers-color-scheme: dark block in Main.css. */",
    renderThemeObject("PALETTE_DARK", dark),
    "",
  ].join("\n");

  writeFileSync(PALETTE_TS, body);
  console.log(`✓ mirror: wrote ${Object.keys(light).length} light + ${Object.keys(dark).length} dark tokens to src/brand/palette.ts`);
}

// ---------------------------------------------------------------------------

const cmd = process.argv[2];
if (cmd === "contrast") runContrast();
else if (cmd === "mirror") runMirror();
else {
  console.error("usage: brand-tools.mjs <contrast|mirror>");
  process.exit(2);
}
