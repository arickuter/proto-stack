# proto-stack

A template for validating product ideas fast. Auth, database, a rebrandable
design system, and guardrails are done once — so a new idea starts at the
interesting part. Built on [Wasp](https://wasp.sh) 0.25.

**A fresh prototype boots with zero external accounts** — email/password with a
console mailer, and Postgres in Docker.

## Create a new prototype

```bash
gh repo create my-idea --template arickuter/proto-stack --private --clone
cd my-idea/app
wasp install                 # regenerate the generated spec package (required on a fresh clone)
cp .env.server.example .env.server
```

Then, in two terminals:

```bash
wasp start db                # terminal 1 — Postgres (Docker). Keep it running.
```
```bash
wasp db migrate-dev          # terminal 2 — first migration
wasp start                   # dev server: http://localhost:3000
```

Sign up at `/signup` (no email verification needed in dev), and you're in.

## Then build it with Claude Code

Run `claude` in the repo and use the skills:

- **`/prototype <your idea>`** — renames the app and builds the walking skeleton
  (entities, operations, screens).
- **`/brand <a brief>`** — rewrites the design tokens, fonts, and palette to your
  brand, enforcing WCAG AA.
- **`/ship`** — upgrades auth for production and deploys to Railway.

## What's inside

- **Auth**: email/password (+ Google, auto-enabled when you add credentials),
  sessions, admin-by-email. All Wasp-managed.
- **Database**: Postgres + Prisma, `wasp start db` for local, Railway in prod.
- **Design system**: one token file (`app/src/client/Main.css`), hand-rolled
  primitives, a flat "paper" default look, and a linter that fails the build on
  off-brand colour. Rebrand via `/brand`.
- **Guardrails**: `npm run check` runs brand-lint, security-lint, and a WCAG
  contrast check.

## Prerequisites

- Node 24.14.1+ · Wasp 0.25 (`npm i -g @wasp.sh/[email protected]`) · Docker

## Docs

Start with [`AGENTS.md`](AGENTS.md); deep dives in [`docs/`](docs/README.md).

## Requirements & prompts

`main.wasp.ts` reads `app/.env.server` at compile time, so **restart
`wasp start` after editing it**. `npm run check` before calling a change done.
