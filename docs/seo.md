# SEO & GEO

How this template stays findable by search engines **and** by generative
engines (ChatGPT, Claude, Perplexity, Gemini). The machine-checkable half is
`app/scripts/seo-lint.mjs` (part of `npm run check`); the judgment calls —
what copy to write, when to prerender a new route — are here.

## Why this exists

AI crawlers do **not** run JavaScript. GPTBot, ClaudeBot, and PerplexityBot
fetch the raw HTML, take what's there, and leave — no second render (a Vercel/MERJ
analysis of 500M+ GPTBot fetches found zero JS execution). Only Google renders
JS, and even it prefers server HTML. A plain React SPA serves the same empty
`200.html` shell for every route, so to a generative engine the landing page is
**blank**. Everything below exists to put real HTML in front of a crawler.

## Prerendering (the core fix)

Wasp renders a route to static HTML at build time when you pass `prerender`:

```ts
route("LandingRoute", "/", page(LandingPage), { prerender: true }),
```

The build emits a real `index.html` for `/` — `<h1>`, copy, meta, and JSON-LD all
present before any JS runs — then React hydrates it on the client. Non-prerendered
routes still fall through to `200.html` (the SPA fallback the `Staticfile` serves),
so prerendering **composes** with the existing setup rather than replacing it.

Rules:

- **Prerender every public marketing/content route** (landing, and any blog,
  pricing, or docs pages you add). That's what crawlers and AI engines read.
- Only static, public paths qualify. A prerendered page **cannot** be
  `authRequired` (Wasp errors at compile), and a `:param`/`*` path needs an
  explicit list of concrete paths (`prerender: ["/blog/intro", …]`).
- Add a matching `<url>` to `public/sitemap.xml` when you add a public route.
- seo-lint (`landing-prerender`) fails the build if `LandingRoute` loses it.

Wasp docs: https://wasp.sh/docs/advanced/prerendering.

## Per-page titles & meta

Wasp has no per-route head, and React 19 hoists `<title>`/`<meta>`/`<link>`
rendered anywhere in the tree into `<head>` — so per-page meta needs no library.
Every routed page renders [`<PageMeta>`](../app/src/client/components/PageMeta.tsx)
(seo-lint `page-title` enforces it):

```tsx
<PageMeta title="Dashboard" />                 // → "Dashboard — AppName"
<PageMeta title="Reset password" noindex />    // utility page, keep it out of the index
<PageMeta />                                    // home page: inherits the global title
```

- **Title format** is `Page — AppName`. The home page passes no `title`, so it
  inherits the global one (`= APP_NAME`). Wasp always emits that global `<title>`
  into the shell, so a page that also set its own on the home page would ship two
  `<title>` tags — hence the home page deliberately omits it.
- **`noindex`** goes on transactional/utility pages with nothing to rank: the
  password-reset and email-verification pages, and the 404. Login and signup stay
  indexable. Auth-required pages (dashboard, account) are unreachable by crawlers
  anyway.

## The global head

`main.wasp.ts` `head` holds the site-wide tags: viewport, favicon, manifest link,
`theme-color`, `description`, Open Graph (`og:type`/`og:site_name`/`og:title`/
`og:description`), `twitter:card`, and the CSP meta. Two constraints:

- **Head strings are rendered as JSX** — attributes must be camelCased
  (`httpEquiv`, not `http-equiv`; `charSet`, not `charset`) and `<meta>`/`<link>`
  must self-close (`/>`), or Wasp drops them silently. seo-lint `head-jsx-attrs`
  catches this (it's how the CSP tag was dead before).
- **Some values mirror `src/shared/app.ts`** because `main.wasp.ts` can't import
  from `src/`. seo-lint keeps the copies honest — never "fix" the duplication by
  deleting a tag:

  | Head tag | Must equal | Enforced by |
  |---|---|---|
  | `title`, `og:title`, `og:site_name` | `APP_NAME` | `name-sync` |
  | `description`, `og:description` | `TAGLINE` | `description-sync` |
  | `theme-color` | `site.webmanifest` `theme_color` | `theme-color-sync` |
  | `site.webmanifest` `name`, `llms.txt` heading | `APP_NAME` | `name-sync` |

## Public assets (`app/public/`)

- **`robots.txt`** — allows all crawlers, **including** AI crawlers. A prototype
  exists to be found; narrow this only with a reason. The `Sitemap:` line is an
  absolute URL, so it ships commented with a `__SITE_URL__` placeholder and `/ship`
  fills it in.
- **`sitemap.xml`** — public marketing routes only (not auth/utility pages). One
  `<loc>` per public route; `/ship` substitutes `__SITE_URL__`.
- **`llms.txt`** — a curated markdown map for AI agents. Honest caveat: Google
  confirmed it does **not** read llms.txt, but Anthropic and OpenAI agent
  workflows do, and it's near-free to keep accurate. Worth most for agent- or
  developer-facing products. `/prototype` rewrites it per idea.
- **`og-image.png`** (optional, not shipped) — a correct default is better than a
  wrong one, so the template ships none; a scraper falls back to title +
  description. To add one: a **1200×630** PNG (wordmark on the brand background);
  `/brand` can generate it, and `/ship` wires `og:image` + `twitter:card:
  summary_large_image` once the file exists. seo-lint `og-image-exists` fails if
  you reference the image without shipping the file.
- **`Staticfile`** — load-bearing, never delete (see [deployment.md](deployment.md)).

## SITE_URL lifecycle

Absolute URLs (canonical, `og:url`, sitemap locs, JSON-LD `url`) need the
production origin, which doesn't exist until deploy. `SITE_URL` in
[`src/shared/app.ts`](../app/src/shared/app.ts) is the single source:

- **Empty in dev/pre-ship** → the landing page omits canonical/`og:url`, the
  robots `Sitemap:` line stays commented, sitemap locs keep the placeholder. All
  valid; nothing broken.
- **`/ship` sets it** to the real origin (no trailing slash) and rewrites the two
  static files to match. seo-lint `site-url-propagation` then requires all three
  to agree and fails on a leftover `__SITE_URL__` or a hardcoded canonical URL.

## Structured data (JSON-LD)

The landing page emits a minimal `WebSite` block for search + AI engines. It's a
`<script type="application/ld+json">` with `dangerouslySetInnerHTML` (the standard
React way; children get HTML-escaped and break the JSON). That's the one allowed
use of `dangerouslySetInnerHTML` — the payload is build-time constants, `<`-escaped
so the JSON is byte-valid, and marked `// json-ld:` so security-lint permits it.
Add `SoftwareApplication`, `Organization`, or `FAQPage` per idea when they
genuinely describe the product — don't stuff schema that isn't true.

## Writing for GEO

Generative engines cite pages that are **factually dense and answer-shaped**.
On the landing page and any content route:

- **Answer first.** The hero's first sentence should state, plainly, what the
  product does and for whom — the sentence an AI would quote. No throat-clearing.
- **Facts over adjectives.** "Auth, Postgres, and a design system, wired up" beats
  "powerful, seamless platform." Specifics get cited; superlatives get skipped.
- **One `<h1>`, a real heading outline.** Sections in `<h2>`, sub-points in `<h3>`;
  pick the level by outline position, not size (`<Heading as="h1" size="…">`).
  seo-lint `heading-h1-as` / `page-h1` enforce this. **The auth pages are the
  exception:** Wasp's own `LoginForm` / `SignupForm` / etc. render their title as
  an `<h2>`, so those pages carry no `<h1>` — seo-lint exempts any page that uses
  `AuthPageLayout`. A different page whose heading lives in a child can opt out
  the same way with a `// no-h1:` marker (the `page-h1` escape hatch).
- **Semantic landmarks** — `<main id="main">`, `<header>`/`<nav>`, `<footer>`,
  skip link — are already the template default; keep them.
- The design anti-tells still apply: sentence case, no mono-caps eyebrows, no
  emoji (see [design-principles.md](design-principles.md)).

## Ship-time checklist (run by `/ship`)

- [ ] `SITE_URL` in `src/shared/app.ts` set to the production origin (no trailing slash).
- [ ] `robots.txt` `Sitemap:` line uncommented with the real URL; no `__SITE_URL__` left.
- [ ] `sitemap.xml` locs point at the real origin.
- [ ] `llms.txt` copy reflects the shipped product.
- [ ] If `public/og-image.png` exists: `og:image` (absolute URL) added and
      `twitter:card` bumped to `summary_large_image`.
- [ ] `npm run check` green (seo-lint included).
- [ ] On the live site: `robots.txt` and `sitemap.xml` return 200; the landing
      URL's **raw** HTML (curl, not the browser) contains the `<h1>` and the
      description — the proof a non-JS crawler sees real content.
