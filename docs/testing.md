# Testing

The default is **zero tests.** A prototype earns its keep by being demoable, and
most of what a test would assert here is already guaranteed by TypeScript, the
Prisma schema, and `npm run security-lint`. Tests are a cost — they slow the
loop and calcify code that's still changing. So a test has to earn its place.

## When a test earns its place

Write one only when a bug would be silent, expensive, and *not* caught by types
or the linters:

- **Money / quota / limits.** Anything that computes a charge, a credit balance,
  a usage cap, proration — arithmetic a user feels in their wallet.
- **Permission logic beyond the linted shape.** security-lint proves an
  operation *has* an auth check; it can't prove the check is *correct*. A
  role/ownership rule with real branching deserves a test.
- **Gnarly pure functions.** A parser, a date/recurrence calculation, a slug or
  diff routine — logic with edge cases you'd otherwise verify by hand each time.
- **A regression that already bit.** Pin it so it can't come back.

## What not to test

- **UI rendering and styling.** Brittle, low-value; `npm run check` already
  guards the design system.
- **Wasp glue** — that an operation is wired, that a route renders. That's the
  framework's job, and `wasp compile` already fails if it's wrong.
- **Trivial CRUD.** Types + security-lint cover the shape; a test that a create
  creates adds nothing.

## How

- **Vitest**, colocated: `thing.ts` → `thing.test.ts` next to it.
- **Node environment** (the default here). Keep logic in **pure functions** that
  take plain args and return values, so a test needs no Wasp `context`, no DB,
  no mocks. If a test would need to mock Wasp, extract the logic instead and test
  that.
- **Run:** `npm run test` from `app/`.
- Component tests are discouraged. If you ever genuinely need one, Wasp ships the
  harness (`wasp/client/test`) — switch the file's environment to `jsdom` and
  reach for it as the exception, not the habit.

## Why it's not in `npm run check`

`npm run check` (brand-lint + security-lint + contrast + palette mirror) is the
always-on gate every change must pass. `npm run test` is separate on purpose:
with few or no tests, folding it into `check` would add nothing most of the time.
Run it when you've written logic worth pinning.
