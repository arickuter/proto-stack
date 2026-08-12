---
name: ship
description: Graduate a validated proto-stack prototype to production on Railway — upgrades auth from the dev console-mailer to a real email provider (and optionally Google), runs the security ship checklist, and deploys. Trigger when the user wants to deploy, ship, go live, put it in production, or "get this in front of real users".
---

# /ship — graduate to Railway

You take a prototype that survived validation and put it in production safely.
Deploying is outward-facing and hard to reverse — confirm before the deploy step.

## First, read the rules

Read [`docs/deployment.md`](../../../docs/deployment.md),
[`docs/providers.md`](../../../docs/providers.md), and the ship checklist in
[`docs/security.md`](../../../docs/security.md).

## Steps

1. **Preflight.**
   - `wasp compile` — must be clean.
   - `npm run check` — brand + security + contrast green.
   - `npm audit --omit=dev` — triage findings (Wasp pulls in some deprecated auth
     deps; assess rather than block).
   - `wasp build` — this will **fail on the `Dummy` mailer**. That failure is the
     designed gate: it means you must set a real email provider (next step). Explain
     this to the user rather than treating it as a bug.

2. **Staged auth upgrade** (via [`docs/providers.md`](../../../docs/providers.md)):
   - Email: set `EMAIL_PROVIDER=Resend` + `RESEND_API_KEY` + a real
     `EMAIL_FROM_ADDRESS` (or SendGrid). Walk the provider guide; don't improvise.
   - Optional Google: set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (the button
     enables itself). Add the prod redirect URI in the Google console.
   - Set `ADMIN_EMAILS` to the real admin address.
   - Remove `SKIP_EMAIL_VERIFICATION_IN_DEV` from the production environment.

3. **Run the security ship checklist** from `docs/security.md` item by item:
   secrets only in Railway env (never committed), headers reviewed, CSP present,
   rate-limiting decision recorded.

4. **Deploy hygiene:** confirm `app/public/Staticfile` exists (never delete it)
   and any `head` `<script>` is `async`.

5. **Deploy** (confirm with the user first — this is outward-facing):
   ```bash
   wasp deploy railway launch <app-name>    # first time
   # wasp deploy railway deploy <app-name>  # subsequent
   ```
   Set the server-side env vars in the Railway project. Railway provisions
   Postgres and `DATABASE_URL`.

6. **Smoke test** the live site: sign up with a real email (verification arrives),
   log in, open a deep link to a routed page (SPA fallback works), hit a 404, and
   confirm an unauthenticated call to an operation is rejected.

## Guardrails

- **Never deploy without explicit user confirmation.** It's outward-facing.
- **Never commit `.env.server`** or any secret. Secrets live in Railway env vars.
- Don't skip the `Dummy`-build failure by forcing it — fix it by setting a real
  provider, which is the point.
- If server and client deploy separately and one fails, fix and redeploy — state
  isn't corrupted.
