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

## Typography

- **A distinctive heading face + a workhorse body**, or a single family used
  well. The default pairs Space Grotesk (headings + body) with IBM Plex Mono
  for functional text. Fonts must exist on [Fontsource](https://fontsource.org)
  so the swap is `npm install @fontsource/<name>` + two lines.
- **Monospace is functional only** — counters ("1 / 10"), code, command names.
  A monospace *label* on marketing copy is one of the clearest "generated page"
  tells. `brand-lint` enforces this.
- **A type scale, not ad-hoc sizes.** Use a ~1.25–1.333 ratio between steps
  (the `Heading` sizes already do). Don't hand-roll `text-[27px]`.
- **Tight tracking on large headings, normal on body.** Headings run
  `letter-spacing: -0.02em`; body stays at 0.

## Space, shape, depth

- **A spacing rhythm on a 4/8px grid.** Section vertical padding is decided
  once in `<Section>` (`density`), not per-instance.
- **Radius is personality.** 0–2px reads technical/precise; 6–10px reads
  friendly; 12px+ reads playful. The default is 2px controls / 6px cards. Pick
  a radius that matches the brief's adjectives and keep it consistent.
- **Depth without shadows by default.** Separation comes from hairline borders,
  inverted (dark) bands, and `gap: 1px` grids that let the background show
  through as dividers. If a brand genuinely needs elevation, `/brand` flips
  `shadows` in `brand.config.json` and removes the `--shadow-*: initial` line
  together — the two must move as one (brand-lint checks this).

## Generated-page tells (forbidden regardless of brand)

These read as "an AI built this in one shot." Don't produce them:

- **Mono-caps / tracked-uppercase eyebrow labels** above a section. A section
  opens with its heading; any supporting label is plain sentence-case text.
- **Numbered feature grids** — the 01 / 02 / 03 / 04 treatment. Use a few plain
  rows, no ordinals.
- **Pill rows that restate the subhead** in three chips.
- **Per-card label chips** and "announcement before content."
- **Emoji as decoration.** Use a Lucide icon (consistent stroke and scale).

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
