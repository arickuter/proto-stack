# Security

A prototype still handles real accounts and real data. These rules avoid the
mistakes that are cheap to make and expensive to discover. The machine-checkable
subset is enforced by `npm run security-lint` (part of `npm run check`); the
judgment calls below are enforced by the `/prototype` and `/ship` skills.

Format is rule / why / how, like a standard.

## What Wasp handles — never hand-roll it

Sessions, cookies, CSRF, and password hashing are Wasp's. Don't reimplement
them, don't store tokens in `localStorage` yourself, don't add your own session
logic. If you think you need to, you're probably solving it at the wrong layer.

## Authorization is per-operation, not per-page

- **Rule:** every query/action checks `context.user` as its first statement
  (or is explicitly marked `// public-operation:`).
- **Why:** Wasp exposes a callable HTTP endpoint for every declared operation.
  `authRequired: true` on a route only stops the *page* from rendering — it does
  nothing for the operation's endpoint. The auth check in the operation is the
  real boundary.
- **How:** `if (!context.user) throw new HttpError(401)`. For admin-only
  actions, also check `context.user.isAdmin` server-side — hiding a button in
  the UI is not authorization.

## Scope every read and write to the current user (IDOR)

- **Rule:** never accept an entity id from the client as proof of ownership.
  Scope by `context.user.id`.
- **Why:** `updateThing({ id })` where `id` comes from the client lets any
  logged-in user edit anyone's row by changing the number. This is the single
  most common prototype vulnerability.
- **How:** `where: { id, userId: context.user.id }` (or fetch-then-check owner).
  [`src/user/operations.ts`](../app/src/user/operations.ts) demonstrates the
  pattern — copy it.

## Validate every input

- **Rule:** zod-parse an operation's args before using them (or mark
  `// no-input:` for an arg-less op).
- **Why:** the client payload is attacker-controlled. An unvalidated field
  flows straight into Prisma.
- **How:** a `z.object({...})` schema and `schema.parse(rawArgs)` as the first
  lines. security-lint checks for this.

## Keep secrets out of the client and the repo

- **Rule:** no secret literals in source; no `process.env` in client code; a
  `REACT_APP_*` var must never hold a secret; `.env.server` stays git-ignored.
- **Why:** anything in a `.tsx` bundle or a `REACT_APP_*` var ships to the
  browser. A committed key is a leaked key.
- **How:** secrets live in `.env.server` (dev) and the host's env (prod).
  security-lint flags secret-shaped strings, client `process.env`, and
  secret-named public vars.

## Don't inject HTML

- **Rule:** no `dangerouslySetInnerHTML`.
- **Why:** it's an XSS sink the moment any of the content is user-influenced.
- **How:** render user/markdown content with `<ReactMarkdown>`.

## Error hygiene & data minimalism

- Throw `HttpError(4xx, "user-safe message")`; never echo a stack trace, SQL
  error, or internal detail to the client.
- Don't store PII you don't need (IP, user-agent, precise location). Don't log
  secrets or PII. Less stored data is less to leak.

## Ship-time checklist (run by `/ship`)

- [ ] `SKIP_EMAIL_VERIFICATION_IN_DEV` is **absent** from the production env.
- [ ] `ADMIN_EMAILS` is set to the real admin address(es).
- [ ] All secrets are set as Railway/host env vars, never committed.
- [ ] `npm run check` is green.
- [ ] `npm audit --omit=dev` is clean or every finding is triaged. (Wasp pulls
      in some deprecated auth deps; assess, don't panic.)
- [ ] `head` `<script>`s are minimal and `async` (not `defer`).
- [ ] CSP `upgrade-insecure-requests` is present (it's in `main.wasp.ts` head).
      For a real CSP, prefer a host response header over the meta tag.
- [ ] Response headers reviewed on the host: `X-Content-Type-Options: nosniff`,
      a sensible `Referrer-Policy`.
- [ ] Rate limiting: fine to skip at validation scale. When traffic justifies
      it, add it to auth/public endpoints via a Wasp `api` with a
      `middlewareConfigFn` + `express-rate-limit` (recipe below).

## Later-stage recipes

- **Rate limiting** — declare the sensitive route as a Wasp `api()` with a
  `middlewareConfigFn` that unshifts `express-rate-limit`. Do this per-endpoint,
  not globally, so it doesn't throttle the SPA.
- **Webhook signature verification** — see [`payments-later.md`](payments-later.md).
  Never trust a webhook body without verifying its signature against the raw
  request bytes.
- **File uploads** — validate type and size against an allowlist server-side and
  use presigned URLs; never proxy raw uploads through the app.
