---
name: prototype
description: Turn a product idea into a running walking skeleton on proto-stack — renames the app, models entities, writes operations and screens, wires the dashboard. Use at the start of a new prototype, or to add the next feature slice. Trigger when the user describes an idea to build, says "prototype this", "start a new app/idea", or asks to scaffold a feature.
---

# /prototype — idea → walking skeleton

You are turning an idea brief into the smallest thing a stranger could try. Scope
ruthlessly to **one core loop**. Speed to a demoable prototype is the whole point.

## First, read the rules

Read [`AGENTS.md`](../../../AGENTS.md), [`docs/wasp-fundamentals.md`](../../../docs/wasp-fundamentals.md),
[`docs/security.md`](../../../docs/security.md), [`docs/frontend.md`](../../../docs/frontend.md),
and [`docs/performance.md`](../../../docs/performance.md). The operation shape in
[`app/src/user/operations.ts`](../../../app/src/user/operations.ts) is your exemplar — copy it.

## Steps

1. **Understand the idea.** Ask at most 3 questions, only if genuinely unclear:
   who is the target user, what is the ONE core loop, and what must be demoable
   to a stranger. Don't interrogate — infer what you can.

2. **Fresh clone setup** (skip if the app already runs): confirm `wasp install`
   has been run and `cp .env.server.example .env.server` is done. If `wasp start db`
   isn't running, tell the user to start it.

3. **Plan and confirm.** Write a short plan — entities, operations, routes — in a
   couple of lines and confirm it with the user before generating code. Keep it to
   the core loop; defer everything else.

4. **Rename identity** so the prototype is itself, not "ProtoStack":
   - `app({ name, title })` in `app/main.wasp.ts`
   - `name` in `app/package.json`
   - `APP_NAME` / `TAGLINE` in `app/src/shared/app.ts`
   - the README H1

5. **Model data.** Edit `app/schema.prisma`, then `wasp db migrate-dev "<message>"`.

6. **Build the loop.** Create feature folders `app/src/<feature>/` with
   `operations.ts` (server) and pages (client), following the exemplar. Declare
   routes/pages/operations in `main.wasp.ts`. Compose UI from the primitives in
   `app/src/client/components/ui` — tokens only.

7. **Rewrite the landing copy** for the idea (in `LandingPage.tsx`), following the
   voice rules in [`docs/design-principles.md`](../../../docs/design-principles.md):
   heading-first sections, sentence case, no generated-page tells.

8. **Verify.** `wasp compile`, remind the user to restart `wasp start` (spec/schema
   changed), then `npm run check`. Fix anything it flags.

9. **Offer next.** Suggest `/brand` to make it look like its own product.

## Guardrails

- **One core loop.** If the idea has five features, build one and list the rest.
- Every operation: check `context.user` first, then zod-parse input, then scope
  reads/writes to `context.user.id` (or mark `// public-operation:` / `// no-input:`
  deliberately). security-lint enforces this.
- **Index the schema:** `@@index` on foreign keys and any filtered/sorted column;
  bound list queries with `take` + `orderBy`. See [`docs/performance.md`](../../../docs/performance.md).
- **Barely any comments.** Default to none; a comment must explain a non-obvious
  *why*, never narrate the code. See the Comments rules in [`AGENTS.md`](../../../AGENTS.md).
- **Never touch design tokens** — that's `/brand`. Never edit `src/brand/palette.ts`.
- No payments. If the idea needs them, point at [`docs/payments-later.md`](../../../docs/payments-later.md).
- Want real Google login in dev? Follow [`docs/providers.md`](../../../docs/providers.md#google-oauth) — don't improvise console steps.
- Editing `main.wasp.ts` or `schema.prisma` requires a `wasp start` restart to regenerate types.
- Add an npm dependency only with `npm install` in `app/`, and only if the loop needs it.
