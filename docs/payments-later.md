# Payments (add later)

Payments are deliberately **not** wired. A validation prototype shouldn't carry
a Stripe integration, a subscription model, or a webhook it doesn't use. This
doc is the path to add them once an idea has earned it — not code to enable.

Reach for this only when you have a reason to charge someone.

## The shape

Wasp + Stripe is well-trodden (OpenSaaS is the reference). The pieces:

1. **Stripe keys** — secret key server-side only, publishable key client-side.
   See [`providers.md`](providers.md#stripe-only-when-an-idea-is-validated).
2. **A `payment` feature folder** — `src/payment/operations.ts` for
   `createCheckoutSession` / `getCustomerPortalUrl`, plus a `plans.ts`.
3. **A webhook** — declared as a Wasp `api()` with a custom `middlewareConfigFn`
   that preserves the **raw body** (Stripe signature verification needs the
   exact bytes, not the parsed JSON).
4. **User/subscription fields** — add `stripeCustomerId`,
   `subscriptionStatus`, etc. to the `User` model (or a `Subscription` model)
   and migrate.

## The one rule you cannot skip

**Verify every webhook signature.** Use `stripe.webhooks.constructEvent(rawBody,
signature, WEBHOOK_SIGNING_SECRET)`. An unverified webhook endpoint lets anyone
POST a fake "payment succeeded" and unlock paid features. This is why the
webhook needs the raw body and its own middleware config.

## Reference

- Wasp custom API + middleware: https://wasp.sh/docs/advanced/apis
- OpenSaaS payments (a full worked example to copy from):
  https://docs.opensaas.sh/guides/payments-integration/

Keep it minimal: one plan, one checkout, one portal link, one verified webhook.
Don't port an entire billing admin dashboard into a prototype.
