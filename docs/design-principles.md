# Design principles

The rulebook the `/brand` skill follows and `/prototype` respects. It encodes
enough real UI/UX craft that a rebrand stays distinctive **and** correct. The
machine-checkable parts are enforced by `npm run check` (brand-lint + contrast);
this doc covers the judgment the linter can't.

The default look is "flat paper": cool off-white page, near-black ink, one
accent hue, no shadows, no gradients, hairline borders. A rebrand may move far
from that — but the principles below hold for every brand.

## Colour

- **One accent hue.** Pick a single brand hue and use it for links, icons,
  emphasis, and marks. Two near-identical hues read as a bug, not a system.
  Status colours (warning, destructive) are semantic, not brand — keep them
  distinct from the accent.
- **60 / 30 / 10.** Roughly 60% neutral surface (`--background`, `--surface`),
  30% ink and structure (`--foreground`, `--muted-foreground`, `--border`),
  10% accent (`--primary`, `--accent`). The accent earns attention by being
  scarce.
- **`--primary` is not the button colour.** By default filled buttons are
  near-black (`--foreground` on `--background`); `--primary` is the accent for
  links and marks. A solid accent-colour button competes with every accent on
  the page. Break this only if the brief explicitly wants an accent-filled
  button, and if you do, drop the accent's use elsewhere so it doesn't fight.
- **Contrast is measured, never eyeballed.** Every text/background pair must
  pass WCAG AA (4.5:1 body, 3:1 large text and UI marks). `npm run contrast`
  computes this from the tokens — iterate token lightness until it's green.
  Don't ship a pair the tool fails.
- **Dark mode is mandatory and is not "invert".** Lift the accent's lightness
  and chroma on dark so links keep AA against the dark background (the default
  green goes from `oklch(45% …)` to `oklch(78% …)`). Deepen surfaces rather
  than inverting them.
- **States move toward ink, and tints are real tokens.** Hover/active step a
  control *darker* on light and *lighter* on dark (`--foreground-hover`,
  `--secondary-hover`, …) — a control never fades toward the page on hover.
  Never use an alpha-composited utility (`bg-destructive/10`) for a surface:
  its rendered colour isn't a token, so `npm run contrast` can't grade it. Give
  a status tint a real `--*-surface` / `--*-on-surface` pair instead. brand-lint
  fails on both an alpha composite and a hover that drops toward the page.

## Typography

- **A distinctive display face + a workhorse body.** The default pairs Space
  Grotesk (display face: headings + wordmark, via `--font-display`) with IBM
  Plex Sans (body, UI, data, via `--font-sans`) and IBM Plex Mono for functional
  text. A display grotesque is built for size — don't set 16px body in it.
  Fonts must exist on [Fontsource](https://fontsource.org) so the swap is
  `npm install @fontsource/<name>` + the weight imports. Load only the weights
  you use; a missing weight (e.g. 600) gets browser-synthesised and looks muddy.
- **Monospace is functional only** — counters ("1 / 10"), code, command names.
  A monospace *label* on marketing copy is one of the clearest "generated page"
  tells. `brand-lint` enforces this (mono is allowed only inside
  `<code>`/`<kbd>`/`<samp>`/`[data-counter]`).
- **A type scale, not ad-hoc sizes.** The `--text-*` tokens encode the scale —
  fluid `clamp()` size, line-height, and per-step letter-spacing — and `Heading`
  consumes them (`text-display`, `text-h1` … `text-h4`). Retune the tokens, not
  the call sites; never hand-roll `text-3xl sm:text-4xl` or `text-[27px]`.
- **Tracking tightens with size,** carried per-step in the token (−0.025em at
  display → 0 at body). Don't apply one global tracking value across all levels.

## Space, shape, depth

- **A spacing rhythm on a 4/8px grid.** Section vertical padding is decided
  once in `<Section>` (`density`), not per-instance.
- **Radius is personality.** 0–2px reads technical/precise; 6–10px reads
  friendly; 12px+ reads playful. The default is 2px on *everything*
  (`--radius-control`) — one radius, near-square, held by brand-lint (no
  `rounded-[…]`, no bare `rounded`, no stock `rounded-md`). A second, larger
  card radius reads as a different intention; if a brief wants friendlier,
  move the one token, don't add a second.
- **Depth without shadows by default.** Separation comes from hairline borders,
  inverted (dark) bands, and `gap: 1px` grids that let the background show
  through as dividers. If a brand genuinely needs elevation, `/brand` flips
  `shadows` in `brand.config.json` and removes the `--shadow-*: initial` line
  together — the two must move as one (brand-lint checks this).

## Accessibility

Contrast (above) is the measured part; these are the rest, and the primitives
already implement them — the job is to preserve them, not reinvent them, and a
`/brand` rewrite must keep every one.

- **Focus is always visible, globally.** Main.css has one `:focus-visible` rule
  (`outline: 2px solid var(--ring); outline-offset: 2px`) that covers every
  interactive element — links, the wordmark, inputs, buttons — so nothing falls
  back to the UA ring. `--ring` exists for exactly this; never `outline-none`
  without a replacement.
- **A skip link is the first focusable element.** App.tsx renders a
  visually-hidden "Skip to content" anchor to `#main` that appears on focus;
  every page's main landmark carries `id="main"`. Keep both — they are the pair.
- **Live feedback gets a role.** An error message is `role="alert"`, a success
  message `role="status"` — the `Alert` primitive does this. A status the user
  can't see announced is a status a screen-reader user misses.
- **Icons that mean nothing get `aria-hidden`;** images that mean something get
  real `alt` text. Decorative Lucide icons next to a text label are decoration.
- **Heading levels are semantic.** `Heading` decouples `as` (the `h1`–`h4`
  level, for document structure) from `size` (the visual scale) — pick the level
  by outline position, the size by looks. Don't skip levels for styling.
- **Everything works from the keyboard.** Real `<button>` and `<a>` (the `Button`
  primitive renders one or the other) — never a click-handler on a `<div>`.
- **Respect `prefers-reduced-motion`.** Main.css has one global block that
  collapses every transition and stops the pulse skeleton under it; the loading
  spinner is the one accepted exception (it signals progress) and is slowed, not
  stopped. New animation needs no per-component handling — the global block
  covers it — but must not become a second exception without cause.

## Generated-page tells (forbidden regardless of brand)

AI-built UI has two kinds of tell. The **visual** ones are what a page looks
like when it was generated in one shot; the **behavioural** ones are what's
missing when only the happy path was built. The second kind is the one that
survives a good-looking screenshot, so it's the one to watch hardest.

### Visual tells — how it looks

These read as "an AI built this in one shot." Don't produce them:

- **Mono-caps / tracked-uppercase eyebrow labels** above a section. A section
  opens with its heading; any supporting label is plain sentence-case text. This
  bans the *label above the heading* itself, not just its capitalisation — a
  sentence-case muted line announcing the heading that follows is the same tell.
- **Numbered feature grids** — the 01 / 02 / 03 / 04 treatment. Use a few plain
  rows, no ordinals.
- **Pill rows that restate the subhead** in three chips.
- **Per-card label chips** and "announcement before content."
- **Emoji as decoration.** Use a Lucide icon (consistent stroke and scale).
- **Purple→blue gradients and glassmorphism**, neon glow under cards, stacked
  rounded outlines. The flat system bans gradients and shadows at build level;
  don't reintroduce them by hand.

### Behavioural smells — what's missing

A screenshot can't show these, which is exactly why generated UI skips them.
Each is a place the demo works and the product doesn't:

- **A query with only its happy path.** Every `useQuery` renders loading, empty,
  and error — `Skeleton`, `EmptyState`, `Alert`. A list that assumes it always
  has rows, or never fails, isn't finished. See `docs/frontend.md` and the notes
  card on the dashboard (the living reference).
- **Generic error copy.** "Something went wrong. Please try again" strips the
  voice out exactly when a user needs reassurance. Say what happened and what's
  still fine ("The rest of the app is fine. Reload to try again").
- **Dead variants and unwired tokens.** A component variant nothing renders, a
  token defined and never consumed, a class with no element — all read as
  half-built. brand-lint's `token-orphan` rule fails the build on an unused
  colour token; hold the same bar for variants and CSS classes it can't see.
- **Keyboard and focus neglect.** Tab through it. If focus vanishes, if a
  control isn't reachable, or if the target is a 20px text link, it wasn't
  finished — it was screenshotted.
- **Tap targets under 40px.** Comfortable is 44px; the floor is 40. A 32px
  button or a bare-text nav link passes a mouse and fails a thumb.
- **Landing-page polish over app-screen defaults.** A beautiful marketing page
  in front of a dashboard that's one unstyled card is the second-clearest sign
  of a demo. Spend the polish where the product actually lives.
- **Whitespace standing in for content.** Generous section padding is right when
  there's content to frame; around three thin cards it's hiding that there isn't
  a content strategy yet.
- **Self-assessed quality.** A model reviewing its own UI tends to call it
  excellent. Trust the grader, not the opinion: `npm run check` is the grader
  here, which is why every rule above that *can* be a linter is one.

## Voice & copy

- **Sentence case** for headings, buttons, and labels. Not Title Case, not
  ALL CAPS.
- **Outcomes, not mechanisms.** "Get your first user in an afternoon" beats
  "9-step onboarding wizard."
- **Specifics, not superlatives.** Named things and numbers build trust;
  adjectives don't.
- **Single-voice CTAs.** Primary CTAs are verb-led imperatives ("Get started");
  secondary CTAs are descriptive ("How it works"). Never both styles in one row.
- **Sections open with their heading** — nothing is announced before it exists.
