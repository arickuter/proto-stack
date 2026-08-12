# Deployment (Railway)

The `/ship` skill drives this. This doc is the reference it follows.

## Before you deploy

1. **Switch off the dev-only shortcuts.** `wasp build` **refuses** the `Dummy`
   email provider — that is the intended gate. Set a real provider first
   (`EMAIL_PROVIDER=Resend` + key — see [`providers.md`](providers.md)) and
   remove `SKIP_EMAIL_VERIFICATION_IN_DEV` from the production env.
2. `npm run check` green, `npm audit --omit=dev` triaged (see
   [`security.md`](security.md) ship checklist).
3. Confirm `app/public/Staticfile` exists and any `head` `<script>` is `async`.

## Deploy

Railway provisions Postgres and sets `DATABASE_URL` automatically.

```bash
# from app/ — FIRST deploy sets up the project:
wasp deploy railway launch <app-name>

# subsequent deploys:
wasp deploy railway deploy <app-name>
```

Set the server-side env vars (email provider key, `ADMIN_EMAILS`, Google creds
if used) in the Railway project. Exact flags and the one-time Railway CLI login
are in the Wasp docs: https://wasp.sh/docs/deployment/deployment-methods/cli —
check them against the version in `main.wasp.ts` rather than assuming.

If you use Google OAuth in production, add
`https://<your-server-url>/auth/google/callback` to the authorized redirect URIs
in the Google console.

## Gotchas

- **`app/public/Staticfile` is required and must not be deleted.** Wasp ships
  `200.html` (not `index.html`); Railway/Railpack needs the Staticfile
  (`root: .`, `index_fallback: true`) to detect the build and fall back
  correctly for SPA routes. Without it, deep links 404.
  (Upstream: wasp-lang/wasp#4045.)
- **Server and client deploy independently.** If one fails, fix and redeploy —
  state isn't corrupted.
- `wasp build` builds the server; the client is built by `npx vite build`. The
  Railway flow handles both, but know the split when reproducing a build.
