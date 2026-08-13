#!/usr/bin/env node
/*
 * seo-lint — the machine-checkable half of docs/seo.md.
 *
 *   node scripts/seo-lint.mjs
 *
 * A prototype's landing page is invisible to AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot don't run JS) unless it's prerendered, and its meta/OG tags
 * silently rot the moment APP_NAME or TAGLINE changes in one place but not the
 * others. These rules catch exactly those drifts: a head tag written as
 * un-hoistable JSX, a required meta tag missing, a name/description that no
 * longer agrees across main.wasp.ts / the manifest / llms.txt, an SEO asset
 * that isn't there, a page with no <title> or the wrong heading level, or a
 * SITE_URL that /ship set in one file but not the others. The judgment calls
 * (what copy to write, when to prerender a new route) live in docs/seo.md.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { walk, stripComments, Reporter, lineOf } from "./lint-lib.mjs";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const r = new Reporter(APP);

const read = (rel) => readFileSync(join(APP, rel), "utf8");
const has = (rel) => existsSync(join(APP, rel));
const MAIN = join(APP, "main.wasp.ts");
const APPTS = join(APP, "src/shared/app.ts");
const MANIFEST = join(APP, "public/site.webmanifest");
const LLMS = join(APP, "public/llms.txt");
const ROBOTS = join(APP, "public/robots.txt");
const SITEMAP = join(APP, "public/sitemap.xml");

const main = read("main.wasp.ts");
const mainLine = (needle) => lineOf(main, Math.max(0, main.indexOf(needle)));

// --- Extract the head array (its entries are the only double-quoted strings
// between `head: [` and the first `]`; JS comments in the block have none). ---
const headBlock = main.match(/head:\s*\[([\s\S]*?)\]/);
const headEntries = headBlock ? [...headBlock[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]) : [];
const headText = headEntries.join("\n");
const headContent = (key, attr = "name") => {
  const m = headText.match(new RegExp(`${attr}=['"]${key}['"]\\s+content=['"]([^'"]*)['"]`));
  return m ? m[1] : null;
};

// --- Canonical values from their single sources. ---
const appConst = (name) => {
  const m = read("src/shared/app.ts").match(
    new RegExp(`export const ${name}\\s*=\\s*["']([^"']*)["']`),
  );
  return m ? m[1] : null;
};
const APP_NAME = appConst("APP_NAME");
const TAGLINE = appConst("TAGLINE");
const SITE_URL = appConst("SITE_URL") ?? "";

// name/title live in the app({…}) config, before `head:` — slice so the several
// other `name:` keys (fromField, imports) can't be mistaken for them.
const appCfg = main.slice(main.indexOf("app({"), main.indexOf("head:"));
const cfgName = (appCfg.match(/\bname:\s*["']([^"']*)["']/) || [])[1];
const cfgTitle = (appCfg.match(/\btitle:\s*["']([^"']*)["']/) || [])[1];

const manifest = has("public/site.webmanifest") ? JSON.parse(read("public/site.webmanifest")) : {};
const llmsHeading = has("public/llms.txt") ? (read("public/llms.txt").match(/^#\s+(.+)$/m) || [])[1]?.trim() : null;

// ── 1. head tags must be hoistable JSX ──────────────────────────────────────
// Wasp renders each head string as JSX. A kebab-cased attribute is dropped
// (this is how the CSP meta silently died as `http-equiv`), and a <meta>/<link>
// that isn't self-closed is invalid JSX.
const BAD_ATTRS = [
  ["http-equiv", "httpEquiv"],
  ["charset", "charSet"],
  ["crossorigin", "crossOrigin"],
  ["class", "className"],
];
for (const entry of headEntries) {
  const tag = entry.trim();
  if (!/^<(meta|link|script|style|title)\b/.test(tag)) continue;
  for (const [bad, good] of BAD_ATTRS) {
    if (new RegExp(`\\b${bad}\\s*=`).test(tag)) {
      r.add(MAIN, mainLine(entry), "head-jsx-attrs",
        `head tag uses JSX-invalid \`${bad}=\` — Wasp renders head as JSX, use \`${good}=\` (kebab attrs are silently dropped)`);
    }
  }
  if (/^<(meta|link)\b/.test(tag) && !/\/>\s*$/.test(tag)) {
    r.add(MAIN, mainLine(entry), "head-jsx-attrs",
      `head <meta>/<link> must be self-closed with /> : ${tag}`);
  }
}

// ── 2. required global head tags ────────────────────────────────────────────
const REQUIRED_HEAD = [
  ["name='viewport'", /name=['"]viewport['"]/],
  ["a favicon <link rel='icon'>", /rel=['"]icon['"]/],
  ["<link rel='manifest'>", /rel=['"]manifest['"]/],
  ["name='theme-color'", /name=['"]theme-color['"]/],
  ["name='description'", /name=['"]description['"]/],
  ["property='og:type'", /property=['"]og:type['"]/],
  ["property='og:title'", /property=['"]og:title['"]/],
  ["property='og:description'", /property=['"]og:description['"]/],
  ["name='twitter:card'", /name=['"]twitter:card['"]/],
  ["the CSP httpEquiv meta", /httpEquiv=['"]Content-Security-Policy['"]/],
];
for (const [label, re] of REQUIRED_HEAD) {
  if (!re.test(headText)) {
    r.add(MAIN, mainLine("head:"), "head-required-tags",
      `head is missing ${label} — see docs/seo.md`);
  }
}

// ── 3. name sync across every place the app names itself ─────────────────────
const nameChecks = [
  ["main.wasp.ts title:", cfgTitle, MAIN, mainLine("title:")],
  ["main.wasp.ts app name:", cfgName, MAIN, mainLine("app({")],
  ["site.webmanifest name", manifest.name, MANIFEST, 2],
  ["llms.txt # heading", llmsHeading, LLMS, 1],
  ["head og:title", headContent("og:title", "property"), MAIN, mainLine("og:title")],
  ["head og:site_name", headContent("og:site_name", "property"), MAIN, mainLine("og:site_name")],
];
for (const [label, value, file, line] of nameChecks) {
  if (value !== APP_NAME) {
    r.add(file, line, "name-sync",
      `${label} is ${JSON.stringify(value)} but APP_NAME is ${JSON.stringify(APP_NAME)} — keep them in sync (src/shared/app.ts is the source)`);
  }
}
if (!manifest.short_name) {
  r.add(MANIFEST, 3, "name-sync", "site.webmanifest short_name is empty");
}
// Rename completeness: APP_NAME moved off the template default, package.json didn't.
if (APP_NAME !== "ProtoStack") {
  const pkgName = JSON.parse(read("package.json")).name;
  if (pkgName === "proto-stack") {
    r.add(join(APP, "package.json"), 2, "name-sync",
      'package.json name is still "proto-stack" after a rename — set it to the app slug');
  }
}

// ── 4. description sync ──────────────────────────────────────────────────────
for (const [label, value, key, attr] of [
  ["head description", headContent("description"), "description", "name"],
  ["head og:description", headContent("og:description", "property"), "og:description", "property"],
]) {
  if (value !== TAGLINE) {
    r.add(MAIN, mainLine(`${attr}='${key}'`), "description-sync",
      `${label} is ${JSON.stringify(value)} but TAGLINE is ${JSON.stringify(TAGLINE)} — keep them in sync`);
  }
}

// ── 5. theme-color sync (head ↔ manifest) ────────────────────────────────────
const headTheme = headContent("theme-color");
if (headTheme !== manifest.theme_color) {
  r.add(MAIN, mainLine("theme-color"), "theme-color-sync",
    `head theme-color ${JSON.stringify(headTheme)} ≠ site.webmanifest theme_color ${JSON.stringify(manifest.theme_color)}`);
}

// ── 6. the SEO assets must exist ─────────────────────────────────────────────
for (const asset of ["public/robots.txt", "public/sitemap.xml", "public/llms.txt", "public/site.webmanifest", "public/Staticfile"]) {
  if (!has(asset)) r.add(join(APP, asset), 1, "public-assets", `${asset} is missing — see docs/seo.md`);
}

// ── 7. SITE_URL propagation (only once /ship has set it) ─────────────────────
if (SITE_URL) {
  if (has("public/robots.txt")) {
    const robots = read("public/robots.txt");
    if (!new RegExp(`^\\s*Sitemap:\\s*${escapeRe(SITE_URL)}/sitemap\\.xml\\s*$`, "m").test(robots)) {
      r.add(ROBOTS, 1, "site-url-propagation",
        `SITE_URL is set but robots.txt has no uncommented \`Sitemap: ${SITE_URL}/sitemap.xml\` line`);
    }
    if (robots.includes("__SITE_URL__")) {
      r.add(ROBOTS, lineOf(robots, robots.indexOf("__SITE_URL__")), "site-url-propagation",
        "robots.txt still contains the __SITE_URL__ placeholder");
    }
  }
  if (has("public/sitemap.xml")) {
    const sitemap = read("public/sitemap.xml");
    for (const m of sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)) {
      if (!m[1].startsWith(SITE_URL)) {
        r.add(SITEMAP, lineOf(sitemap, m.index), "site-url-propagation",
          `sitemap <loc> ${JSON.stringify(m[1])} does not start with SITE_URL ${JSON.stringify(SITE_URL)}`);
      }
    }
    if (sitemap.includes("__SITE_URL__")) {
      r.add(SITEMAP, lineOf(sitemap, sitemap.indexOf("__SITE_URL__")), "site-url-propagation",
        "sitemap.xml still contains the __SITE_URL__ placeholder");
    }
  }
}

// ── 8. the landing route is prerendered ──────────────────────────────────────
const landingIdx = main.indexOf('route("LandingRoute"');
if (landingIdx === -1 || !/prerender:\s*true/.test(main.slice(landingIdx, landingIdx + 200))) {
  r.add(MAIN, landingIdx === -1 ? mainLine("spec:") : lineOf(main, landingIdx), "landing-prerender",
    "LandingRoute has no `prerender: true` — the landing page would ship as a JS-only shell no AI crawler can read");
}

// ── 9 & 10. every routed page renders <PageMeta> and owns exactly one h1 ──────
const refPaths = {};
for (const m of main.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+["'](\.\/src\/[^"']+)["']\s+with\s*\{\s*type:\s*["']ref["']\s*\}/g)) {
  refPaths[m[1]] = m[2];
}
for (const m of main.matchAll(/import\s+\{([^}]+)\}\s+from\s+["'](\.\/src\/[^"']+)["']\s+with\s*\{\s*type:\s*["']ref["']\s*\}/g)) {
  for (const name of m[1].split(",").map((s) => s.trim()).filter(Boolean)) refPaths[name] = m[2];
}
const pageIdents = new Set([...main.matchAll(/page\(\s*([A-Za-z0-9_]+)/g)].map((m) => m[1]));
for (const ident of pageIdents) {
  const rel = refPaths[ident];
  if (!rel) continue;
  const file = join(APP, `${rel}.tsx`);
  if (!existsSync(file)) continue;
  const raw = readFileSync(file, "utf8");
  const txt = stripComments(raw);
  if (!/<PageMeta\b/.test(txt) && !/<title\b/.test(txt)) {
    r.add(file, 1, "page-title", `page "${ident}" renders no <PageMeta> or <title> — add <PageMeta title="…" /> (docs/seo.md)`);
  }
  const hasH1 = /\bas=["']h1["']/.test(txt) || /<h1[\s>]/.test(txt);
  const exemptH1 = /AuthPageLayout/.test(txt) || raw.includes("no-h1:");
  if (!hasH1 && !exemptH1) {
    r.add(file, 1, "page-h1", `page "${ident}" has no <h1> — a page needs exactly one (mark // no-h1: if its heading lives in a child)`);
  }
}

// ── 11, 12, 13. component-level checks across src/**.tsx ─────────────────────
const tsx = walk(join(APP, "src"), [".tsx"]);
let referencesOgImage = /og:image|twitter:image/.test(headText);
for (const file of tsx) {
  const raw = readFileSync(file, "utf8");
  const src = stripComments(raw);
  if (/og:image|twitter:image/.test(src)) referencesOgImage = true;

  // 11. <Heading size="h1"|"display"> must set as="h1", or it renders an <h2>.
  for (const m of src.matchAll(/<Heading\b[^>]*>/g)) {
    const tag = m[0];
    if (/size=["'](h1|display)["']/.test(tag) && !/\bas=["']h1["']/.test(tag)) {
      r.add(file, lineOf(src, m.index), "heading-h1-as",
        'a <Heading size="h1"/"display"> without as="h1" renders an <h2> — add as="h1"');
    }
  }
  // 12. every <img> needs alt.
  for (const m of src.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) {
      r.add(file, lineOf(src, m.index), "img-alt", "<img> without alt= — add alt (empty alt='' if decorative)");
    }
  }
  // 13. a hardcoded canonical/og:url must go through the SITE_URL constant.
  for (const m of src.matchAll(/rel=["']canonical["'][^>]*href=["']https?:\/\//g)) {
    r.add(file, lineOf(src, m.index), "site-url-propagation",
      "hardcoded canonical URL — build it from SITE_URL (src/shared/app.ts) so it can't go stale");
  }
}

// 13b. an og:image reference obliges the asset to exist.
if (referencesOgImage && !has("public/og-image.png")) {
  r.add(join(APP, "public/og-image.png"), 1, "og-image-exists",
    "og:image / twitter:image is referenced but public/og-image.png does not exist");
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

r.finish("seo-lint");
