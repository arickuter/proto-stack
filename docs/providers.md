# Providers

Step-by-step setup for each external service, with exact console URLs. A fresh
prototype needs **none** of these — email/password + Dummy mailer + Docker
Postgres run with zero accounts. Wire a provider only when you need it.

Every var goes in `app/.env.server`. After editing that file, **restart
`wasp start`** (the spec reads it at compile time).

---

## Google OAuth

Enables the "Sign in with Google" button. It appears automatically once both
vars are set — no code change. In dev, "Testing" mode with your own account
needs no Google review.

1. Create a project: https://console.cloud.google.com/projectcreate
2. Search "Google Auth" in the console and open the **Google Auth Platform**.
3. **App information** → audience type **External**. Fill app name + your email.
4. **Clients** → **Create client** → application type **Web application**.
5. Under **Authorized redirect URIs**, add exactly:
   - dev: `http://localhost:3001/auth/google/callback`
   - prod (later): `https://<your-server-url>/auth/google/callback`
6. **Data Access** → add scope `userinfo.profile` (and `userinfo.email`).
7. **Audience** → add your Google account under **Test users**.
8. Copy the client ID and secret into `.env.server`:
   ```
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   ```
9. **Verify:** restart `wasp start`; the compile log prints
   `Google OAuth: enabled` and a Google button appears on `/login`.

---

## Resend (recommended email provider for production)

Replaces the Dummy mailer so verification/reset emails actually send.

1. API key: https://resend.com/api-keys → **Create API Key**.
2. (For a real sender) verify a domain: https://resend.com/domains → add the
   shown SPF/DKIM DNS records. Until then, use the shared dev sender
   `onboarding@resend.dev` as the from-address.
3. In `.env.server`:
   ```
   EMAIL_PROVIDER=Resend
   EMAIL_FROM_NAME=YourApp
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com   # or onboarding@resend.dev
   RESEND_API_KEY=re_...
   ```
4. **Verify:** restart `wasp start`, sign up with a real address, confirm the
   verification email arrives.

## SendGrid (alternative)

1. API key: https://app.sendgrid.com/settings/api_keys
2. Verify a sender/domain: https://app.sendgrid.com/settings/sender_auth
3. In `.env.server`: `EMAIL_PROVIDER=SendGrid`, `SENDGRID_API_KEY=...`, plus the
   from-address vars.

---

## Railway (hosting)

Postgres + server + client hosting. `wasp deploy railway` provisions the
database and sets `DATABASE_URL` for you.

1. Sign up: https://railway.app/new
2. Install the Railway CLI and log in (the Wasp deploy command uses it).
3. Deploy: see [`deployment.md`](deployment.md) — the `/ship` skill drives this.
4. Wasp Railway deploy docs: https://wasp.sh/docs/deployment/deployment-methods/cli

---

## Umami (optional, privacy-friendly analytics)

1. Sign up: https://cloud.umami.is/signup (or self-host).
2. Add your website; copy the website id and script URL.
3. Add the script to the `head` array in `main.wasp.ts` — it **must** be
   `async`, not `defer` (React hydration). Public config only; no secrets.

---

## Stripe (only when an idea is validated)

Payments are intentionally not wired. When you're ready, see
[`payments-later.md`](payments-later.md). Keys:

- API keys: https://dashboard.stripe.com/apikeys (use the **secret** key
  server-side only).
- Webhooks: https://dashboard.stripe.com/webhooks — copy the signing secret and
  verify every webhook signature.
