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
| `--background` / `--surface` | Page and card backgrounds. |
| `--surface-elevated` | Modal/popover/input backgrounds. |
| `--surface-inverted*` | Dark bands (differentiator sections, footers) via `tone="inverted"`. |
| `--muted` / `--muted-foreground` | Muted section fill / secondary text. |
| `--secondary` / `--secondary-foreground` | Secondary fills and their text. |
| `--success` (= `--primary`) | Shares the accent deliberately. |
| `--warning`, `--destructive` | Semantic status; the only amber / red. |
| `--border` | All borders — hairline separation replaces shadow. |
| `--radius` 2px / `--radius-card` 6px | Control / card corners. |

Two structural rules make the "flat" look:

- **`--shadow-*: initial`** deletes Tailwind's shadow utilities — `shadow-lg`
  fails to build. Depth is hairline borders and inverted bands.
- **No gradients.** `.accent-text` gives a solid-accent heading word.

`brand-lint` enforces both, plus "no raw colours / hex" and token parity
between the two themes.

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
| `<Section>` | Vertical-rhythm section. `tone="default\|muted\|accent\|inverted"`, `density`. |
| `<Heading>` | Size-aware heading. `as`, `size="display\|h1\|h2\|h3"`, `align`. |
| `<Card>` | Surface card. Polymorphic `as`, `padding`, `hoverable` (border-only hover). |
| `<Button>` | Polymorphic — pass `href` for an in-app link. Variants `primary\|secondary\|ghost\|ghost-secondary\|cta\|inverted`; `loading`/`loadingText`. |
| `<NavLink>` | Nav link. `variant="default\|mobile"`. |
| `<Alert>` | Inline `error`/`success` message, token-coloured. |

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

- **Space Grotesk** — headings and body (self-hosted via `@fontsource`,
  imported in `App.tsx`).
- **IBM Plex Mono** — functional only: counters and code. Never labels or
  eyebrows. `brand-lint` fails `font-mono` outside the allowlist.
- Use `<Heading size>` rather than hand-rolled `text-3xl sm:text-4xl …`.

## Section rhythm

Wrap top-level sections in `<Section>` (padding decided there via `density` —
don't override with ad-hoc `py-*`). Inside, a `<Container>` for width. The
landing page is the living reference for all of the above.
