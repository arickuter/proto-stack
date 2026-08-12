# Frontend conventions

How the client is built, beyond the visual rules in
[`design-system.md`](design-system.md) and [`design-principles.md`](design-principles.md).
These keep screens predictable so the next feature slice drops in cleanly.

## State: one source, no mirrors

- **Server state lives in `useQuery` only.** Never copy a query result into
  `useState` and keep them in sync — the copy goes stale and you debug a ghost.
  Read from the query; derive what you need during render.
- **Local UI state** (a modal open flag, an input's value) is `useState`.
- **No global store** at this scale. Wasp's query cache is the shared layer;
  prop-drill or lift the little that's left. Reach for context only for
  genuinely app-wide, rarely-changing values.

## Every query handles loading, empty, and error

- **Rule:** a `useQuery` consumer renders all three states, not just the happy
  path.
- **Why:** the happy path is one of four things a user sees; the other three are
  where "prototype" starts to show.
- **How:** `const { data, isLoading, error } = useQuery(getThings)`. Guard
  `isLoading` with `<Skeleton>`, then `error` with `<Alert variant="error">`,
  then **empty** with `<EmptyState>` — a one-sentence prompt plus the CTA that
  fills it — never a blank region.
- **The living reference:** the dashboard's notes card
  ([`DashboardPage.tsx`](../app/src/dashboard/DashboardPage.tsx), backed by
  [`src/notes/operations.ts`](../app/src/notes/operations.ts)) renders all three
  states against a real query. Copy its shape rather than inventing placeholder
  markup.

## Forms

- **Controlled inputs**, value + `onChange` from `useState`.
- **Disable submit while pending** — use the `Button` primitive's `loading` prop
  (it keeps the label, sets `aria-busy`, blocks double-submit).
- **Show server errors** with `<Alert variant="error">{err.message}</Alert>`.
  Operation error messages are written to be user-safe (see
  [`security.md`](security.md)), so surfacing `err.message` is fine.
- **Client validation mirrors, never replaces, the server.** The operation's zod
  schema is the boundary that counts; client checks are just faster feedback.

## Errors

- The root `ErrorBoundary` already wraps the routed outlet in `App.tsx` — a
  render crash shows a fallback, not a white screen. Don't remove it.
- Operations throw `HttpError(4xx, "user-safe message")`; the client shows the
  message. Don't leak internals to the UI.

## File organisation

- **Feature folders:** `src/<feature>/` holds that feature's page(s) and its
  `operations.ts`. Follow `src/user/` — `AccountPage.tsx` + `operations.ts`.
- **Name the operations file `operations.ts`** (or `queries.ts` / `actions.ts`).
  security-lint keys its auth/input checks on those names — an operation in a
  differently-named file gets **no** enforcement. This is a real rule, not a
  style preference.

## Comments: default to none

Same rule as the [AGENTS.md](../AGENTS.md) non-negotiables — restated because
this is where generated code accumulates cruft:

- The **default is no comment.** Names and structure carry meaning. A comment
  that restates the code (`// set loading to true`) is deleted, or the name is
  fixed.
- A comment must say what the code **can't**: a non-obvious *why*, an external
  constraint or workaround (with a link), a consequence warning.
- The lint markers (`// public-operation:`, `// no-input:`, `// external-api:`)
  are functional annotations, always allowed.

## Responsive

- **Mobile-first.** Build the small layout, add `sm:`/`md:` for larger.
- **Verify at 375px** — no horizontal scroll, tap targets stay reachable.
- The `overflow-x` guard on `html` in
  [`Main.css`](../app/src/client/Main.css) is load-bearing (it protects router
  scroll restoration) — read the comment there before touching it.
