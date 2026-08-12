# Performance

Prototype-scale rules only. The bar is: nothing is *obviously* wrong at demo
size (a few users, hundreds of rows). This is not about micro-optimisation or
scale you don't have yet — it's about the handful of mistakes that are cheap to
avoid now and turn into rewrites later. None of this is machine-enforced; it's
judgment the `/prototype` skill applies when it writes operations and schema.

Format is rule / why / how, like [`security.md`](security.md).

## Select the fields a screen needs

- **Rule:** on list/collection queries, `select` the columns the UI renders
  instead of returning whole entities.
- **Why:** `findMany()` ships every column of every row — including large text
  and fields the client never shows — over the wire on each poll.
- **How:** `prisma.thing.findMany({ select: { id: true, title: true } })`. It
  also keeps you from leaking a field you forgot was there (see the data
  minimalism rule in [`security.md`](security.md)).

## Never query inside a loop (N+1)

- **Rule:** don't call the database inside a `map`/`for` over rows.
- **Why:** one query per row is the N+1 trap — 50 rows become 51 round-trips and
  the page crawls the moment real data lands.
- **How:** fetch relations with `include` in the original query, or batch with a
  single `where: { id: { in: ids } }`. One query in, one query out.

## Index what you filter and sort on

- **Rule:** add `@@index` to every foreign key and any column used in a `where`
  or `orderBy`.
- **Why:** Postgres does **not** auto-index foreign keys. Unindexed filters do a
  sequential scan — invisible at 20 rows, a wall at 20,000.
- **How:** in `schema.prisma`, `@@index([userId])`, `@@index([userId, createdAt])`
  for a scoped, sorted list. Unique constraints already index.

## Bound every list

- **Rule:** no unbounded `findMany`. Every collection query has a `take` and a
  deterministic `orderBy`.
- **Why:** "show all" is fine at demo size and unbounded in production; without
  `orderBy` the order isn't even stable between calls.
- **How:** `take: 50, orderBy: { createdAt: "desc" }`. Add cursor/offset paging
  only when a screen actually needs page two.

## Client: don't fight the cache

- **`useQuery` already caches and dedupes.** Read from it directly; don't copy
  results into `useState` and sync them — that's the bug factory. Derive values
  during render instead. See [`frontend.md`](frontend.md).
- **Don't reflex-memoize.** React 19 + the compiler make most `useMemo`/
  `useCallback` noise. Reach for them only when you've measured a real cost.
- **Split only heavy routes.** `React.lazy` a route that pulls a big dependency
  (a chart lib, an editor); don't code-split the whole app by reflex.
- **Ship reasonable assets.** Give images explicit width/height (no layout
  shift); no multi-MB files in `public/`. Fonts are self-hosted via
  `@fontsource` already.

## Deliberately later

Out of scope at validation stage — revisit when traffic is real, the way
[`payments-later.md`](payments-later.md) treats payments:

- Response caching, Redis, or a CDN in front of the API.
- Read replicas, connection pooling tuning, query profiling.
- Real-user monitoring / web-vitals dashboards.
- Bundle-size budgets and tree-shaking audits.

If you find yourself needing these, the idea has graduated — that's a good
problem.
