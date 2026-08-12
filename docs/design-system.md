# Design system

How the UI is built. Compose pages from the primitives; the look comes from the
tokens. For the *why* behind the choices and the rules a rebrand must follow,
see [`design-principles.md`](design-principles.md).

## Tokens

One source of truth: [`app/src/client/Main.css`](../app/src/client/Main.css).
Colours are oklch custom properties in `:root` (light) and the
`prefers-color-scheme: dark` block, exposed to Tailwind via `@theme inline`.
Always reference a token by its semantic name — `bg-primary`,
`text-muted-foreground`, `bg-surface` — never a raw Tailwind colour or a hex.

| Token | For |
|---|---|
| `--primary` (accent) | Links, icons, inline emphasis, marks. **Not buttons.** |
| `--accent` | Brighter accent for marks on dark bands. |
| `--foreground` | Body text **and filled-button surfaces** (buttons are near-black). |
| `--foreground-hover` / `--foreground-active` | Filled-button hover / pressed — a step toward ink. |
| `--background` | Page background. |
| `--surface` / `--surface-elevated` | Card / input backgrounds — page < card < elevated in lightness, so a card earns its edge. |
| `--surface-inverted*` | Dark bands (differentiator sections, footers) via `tone="inverted"`. |
| `--muted` / `--muted-foreground` | Muted section fill / secondary text. |
| `--secondary` / `--secondary-foreground` | Secondary fills and their text. |
| `--secondary-hover` / `--secondary-active` | Secondary-button hover / pressed. |
| `--success` | A distinct, darker green from the link accent — a saved state isn't a link. |
| `--warning`, `--destructive` | Semantic status; the only amber / red. |
| `--*-surface` / `--*-on-surface` (success, destructive) | Alert tints — **real** token pairs, not alpha composites, so contrast is measured. |
| `--border` | All borders — hairline separation replaces shadow. |
| `--border-hover` | Ghost-button hover border. |
| `--ring` | Keyboard focus ring. Accessibility, not decoration. |
| `--radius-control` 2px | The one radius — controls, cards, everything. |

State tokens (`*-hover`, `*-active`) always move **toward ink** — darker on
light, lighter on dark — never toward the page. Status tints are real tokens so
`npm run contrast` can grade the text-on-tint pair; an alpha composite
(`bg-destructive/10`) can't be graded and brand-lint fails on it.

Beyond colour, three namespaces carry the rest of the system: `--radius-control`
(one radius), `--motion-fast` / `--motion-base` / `--motion-ease` (the whole
motion vocabulary), and `--text-display … --text-small` (the fluid type scale —
size, line-height, letter-spacing per step, consumed by `Heading`).

Two structural rules make the "flat" look:

- **`--shadow-*: initial`** deletes Tailwind's shadow utilities — `shadow-lg`
  fails to build. Depth is hairline borders and inverted bands.
- **`--radius-*: initial`** deletes the stock radius scale — bare `rounded` and
  `rounded-md` fail to build; `rounded-control` is the only radius.
- **No gradients.** `.accent-text` gives a solid-accent heading word.

**Custom CSS goes in a layer.** Base element styles (`* { border-color }`,
`h1..h6`, `body`) live in `@layer base` in Main.css. This is not optional: in
Tailwind v4, CSS written outside a layer beats **every** `@layer utilities` rule
regardless of specificity, so an unlayered `h1 { line-height }` or
`* { border-color }` silently overrides `text-h1`, `border-primary`, and every
other utility. Component classes that must win over utilities on purpose (e.g.
`.surface-inverted` recolouring nested headings) stay unlayered by design.

`brand-lint` enforces these, plus "no raw colours / hex", "no alpha composites",
"no font-family literals", and radius/mono discipline. It checks a **token
canon**: 32 required tokens (the ones above) must be defined in **both** the
light `:root` and the dark block — a token in one theme but not the other fails
the build — and every colour token must be **consumed** somewhere (`token-orphan`:
a defined-but-unused colour token fails, unless listed in `reservedTokens`). It
also fails on `no-shouting` (adjacent ALL-CAPS words). `npm run check`
additionally verifies `palette.ts` is in sync with the tokens (`mirror --check`),
so a token edit can't ship with a stale hex mirror.

## Non-CSS surfaces: palette.ts

[`app/src/brand/palette.ts`](../app/src/brand/palette.ts) is the sRGB hex mirror
of every token, for surfaces that can't read a CSS variable (favicon/manifest
colours, OG images, email). It is **generated** — run `npm run brand:mirror`
after changing tokens; never hand-edit it. `brand-lint` allows hex only there.

## Primitives

Compose from [`app/src/client/components/ui`](../app/src/client/components/ui)
(barrel `index.ts`):

| Component | Use |
|---|---|
| `<Container>` | Centered max-width wrapper. `width="narrow" \| "default" \| "wide"`. |
| `<Section>` | Vertical-rhythm section. `tone="default\|muted\|fill\|inverted"`, `density`. |
| `<Heading>` | Size-aware heading. `as`, `size="display\|h1\|h2\|h3\|h4"`, `align`. |
| `<Card>` | Surface card. Polymorphic `as`, `padding`, `hoverable` (border-only hover). |
| `<Button>` | Polymorphic — pass `href` for an in-app link. Variants `primary\|secondary\|ghost\|ghost-secondary\|cta\|inverted`; `loading`/`loadingText`. Every size clears a 40–44px tap target. |
| `<NavLink>` | Nav link (single style; 44px tap target). |
| `<Field>` / `<Input>` | Labelled form field + text input. `Field` wires the label and optional error to the control. |
| `<Alert>` | Inline `error`/`success` message on a real status tint. |
| `<EmptyState>` | The screen a list shows with no rows — `title`, body, optional `action`. |
| `<Skeleton>` | Loading placeholder (`lines`); static under reduced-motion. |

`ErrorBoundary` (wraps the routed `<Outlet/>` in `App.tsx`) also lives there.
`cn()` (`src/client/cn.ts`) is `twMerge(clsx(...))` — use it for conditional
classes; never re-implement it.

**Buttons are near-black, not accent-coloured** — `--primary` is the link/mark
accent. A solid accent button would fight the accent everywhere.

## Auth forms

Wasp's built-in `LoginForm`/`SignupForm`/etc. are mapped onto these tokens by
the `.auth-form-appearance` wrapper in `AuthPageLayout` (it redefines Wasp's
`--color-brand`, `--color-submitButtonText`, … as our tokens). A `/brand`
rebrand reskins auth automatically — no auth-page edits needed.

## Typography

- **Space Grotesk** (`--font-display`) — the display face: headings and the
  wordmark only. Self-hosted via `@fontsource`, weights 600/700 in `App.tsx`.
- **IBM Plex Sans** (`--font-sans`) — body, UI, and data. A display grotesque
  set small looks off, so it doesn't carry 16px text.
- **IBM Plex Mono** (`--font-mono`) — functional only: counters and code, inside
  `<code>`/`<kbd>`/`<samp>`. Never labels or eyebrows; `brand-lint` fails
  `font-mono` elsewhere.
- The scale lives in the `--text-*` tokens (fluid, per-step tracking). Use
  `<Heading size>` — never hand-roll `text-3xl sm:text-4xl …`.

## States: loading, empty, error

Every `useQuery` consumer renders all three: `<Skeleton>` while loading,
`<Alert variant="error">` on failure, `<EmptyState>` when the list is empty.
The dashboard's notes card ([`DashboardPage.tsx`](../app/src/dashboard/DashboardPage.tsx),
backed by [`src/notes/operations.ts`](../app/src/notes/operations.ts)) is the
living reference — copy its shape. See [`frontend.md`](frontend.md).

## Section rhythm

Wrap top-level sections in `<Section>` (padding decided there via `density` —
don't override with ad-hoc `py-*`). Inside, a `<Container>` for width. The
landing page is the living reference for layout; the dashboard notes card for
query states.
