# Wasp fundamentals

The deep-dive [`AGENTS.md`](../AGENTS.md) defers to. If you've used Next.js or
Remix, the mental-model shifts are: one config file declares the whole app, and
client + server code for a feature live in the same folder.

## What Wasp is

A full-stack framework. You declare your app (auth, routes, pages, operations,
email) in `main.wasp.ts`; Wasp generates the server (Express), the client
(React + Vite + react-router), typed client hooks, and the auth/session layer.
Your code lives in `src/` and is referenced from the spec.

## Project structure

```
app/
├── main.wasp.ts     # the spec — app config, routes, pages, operations
├── schema.prisma    # data models (Wasp adds Auth/AuthIdentity/Session itself)
├── src/
│   ├── client/      # App.tsx (root component), Main.css, components/
│   ├── <feature>/   # a feature folder: SomePage.tsx (client) + operations.ts (server)
│   └── shared/      # isomorphic code (imported by both sides)
├── .wasp/           # GENERATED — SDK, spec package, build output. Never edit.
└── migrations/      # Prisma migration history
```

Client vs server is by **file role**, not folder: `.tsx` pages/components are
client; `operations.ts` and other `.ts` server utilities run on the server.

## main.wasp.ts

Built from `@wasp.sh/spec` constructors. It is a real Node script (Wasp runs it
to produce the spec) — which is why this repo's `main.wasp.ts` can `readFileSync`
its own `.env.server` to decide config. Wasp injects only `NODE_ENV` into that
script; **`.env.server` is not otherwise loaded at spec time**, so edits require
a `wasp start` restart.

### Reference imports

App code is referenced, not imported normally:
```ts
import LandingPage from "./src/landing/LandingPage" with { type: "ref" };
```
Paths are relative to `main.wasp.ts` and must resolve inside `src/`.

### Declaration names

- `route("LandingRoute", "/", page(LandingPage))` — explicit name.
- `action(updateDisplayName, { entities: ["User"] })` — name comes from the
  imported identifier.

## schema.prisma

Standard Prisma. Provider is `postgresql`. `wasp start db` runs Postgres in
Docker and sets `DATABASE_URL` for you; `wasp db migrate-dev "msg"` applies
changes. **Wasp generates the auth tables** (`Auth`, `AuthIdentity`, `Session`)
— don't declare them.

## Operations (queries & actions)

Declared in `main.wasp.ts` with their entities, implemented in
`src/<feature>/operations.ts`. The generated type comes from the declaration
name (`updateDisplayName` → `UpdateDisplayName`). See
[`../app/src/user/operations.ts`](../app/src/user/operations.ts) for the shape
every operation follows (zod-parse, auth check, user-scoped) — and
[`security.md`](security.md) for why each step matters.

Call from the client:
```ts
import { updateDisplayName } from "wasp/client/operations";
await updateDisplayName({ displayName });          // actions: await directly
import { useQuery, getThings } from "wasp/client/operations";
const { data } = useQuery(getThings);              // queries: useQuery
```

`context.entities.User` (scoped to the operation's declared `entities`) is the
Prisma client inside an operation.

## Auth

Declared in the `auth` block: `userEntity`, `methods` (email + optional social),
redirects. Wasp ships the form components (`LoginForm`, `SignupForm`,
`ForgotPasswordForm`, `ResetPasswordForm`, `VerifyEmailForm` from
`wasp/client/auth`) and owns sessions/cookies/hashing.

- An `authRequired: true` page receives a `user` prop (`AuthUser` from
  `wasp/auth`); your `User` columns (`email`, `displayName`, `isAdmin`, …) are
  on it directly.
- `useAuth()` (from `wasp/client/auth`) gives the current user in any component.
- `logout()` (same import) clears the session.
- `userSignupFields` maps provider data → your `User` columns at signup; that's
  where `ADMIN_EMAILS` sets `isAdmin`.

## Import rules

- Wasp imports: `wasp/...` (`wasp/client/auth`, `wasp/server`, `wasp/entities`,
  `wasp/client/operations`, `wasp/client/router`). Never `@wasp/...` or `@src/...`.
- Everything else: relative paths. There is no `@/` alias.

## Dev loop

```bash
wasp start db          # terminal 1 — Postgres (Docker)
wasp db migrate-dev    # after a schema change
wasp start             # terminal 2 — :3000 client, :3001 server
```

Editing `main.wasp.ts` or `schema.prisma` needs a `wasp start` restart to
regenerate types.

## Type-checking

- `wasp compile` validates the spec and regenerates the SDK.
- **Never** `tsc` / `tsc -b` the root `tsconfig.json` — it reports phantom
  errors. Use `npx tsc -p tsconfig.src.json` to check `src/` alone.

## Common gotchas

- `.env.server` change → restart `wasp start`.
- Ran `wasp clean` or nuked `node_modules` → `wasp install` to regenerate
  `@wasp.sh/spec`.
- `wasp build` builds the server only; `npx vite build` builds the client.
- `head` `<script>` tags must be `async`, not `defer`.
- `wasp build` refuses the `Dummy` email provider (the intended prod gate).
