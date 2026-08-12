import { readFileSync } from "node:fs";

import { action, app, page, route } from "@wasp.sh/spec";

// Auth field mappers (email + optional Google). Runs server-side at signup.
import {
  getEmailUserFields,
  getGoogleAuthConfig,
  getGoogleUserFields,
} from "./src/auth/userSignupFields" with { type: "ref" };

// Client root + pages.
import App from "./src/client/App" with { type: "ref" };
import LandingPage from "./src/landing/LandingPage" with { type: "ref" };
import Login from "./src/auth/LoginPage" with { type: "ref" };
import Signup from "./src/auth/SignupPage" with { type: "ref" };
import { RequestPasswordResetPage } from "./src/auth/email-and-pass/RequestPasswordResetPage" with { type: "ref" };
import { PasswordResetPage } from "./src/auth/email-and-pass/PasswordResetPage" with { type: "ref" };
import { EmailVerificationPage } from "./src/auth/email-and-pass/EmailVerificationPage" with { type: "ref" };
import Dashboard from "./src/dashboard/DashboardPage" with { type: "ref" };
import Account from "./src/user/AccountPage" with { type: "ref" };
import NotFoundPage from "./src/client/components/NotFoundPage" with { type: "ref" };

// Operations.
import { updateDisplayName } from "./src/user/operations" with { type: "ref" };

/*
 * `main.wasp.ts` is evaluated by Wasp as a plain Node script, and Wasp injects
 * only NODE_ENV into its environment — it does NOT load `.env.server`. So this
 * file reads `.env.server` itself to decide, at compile time, which auth
 * methods and email provider to declare.
 *
 * Consequence: after editing `.env.server`, restart `wasp start` so the spec
 * re-evaluates and types regenerate.
 */
function serverEnv(): Record<string, string> {
  try {
    const lines = readFileSync(".env.server", "utf8").split("\n");
    const entries = lines
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const eq = line.indexOf("=");
        return [line.slice(0, eq), line.slice(eq + 1)] as const;
      })
      .filter(([key]) => key);
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

// process.env wins so a shell-exported value still overrides the file.
const env = { ...serverEnv(), ...process.env };

// Google turns on the moment both credentials are present — no code change,
// just fill them in `.env.server` and restart. See docs/providers.md#google-oauth.
const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
console.log(
  googleEnabled
    ? "[proto-stack] Google OAuth: enabled"
    : "[proto-stack] Google OAuth: disabled (set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in app/.env.server to enable)",
);

// "Dummy" logs verification/reset emails to the server console — zero setup in
// dev. `wasp build` REFUSES Dummy, which is the deliberate gate that forces a
// real provider before you ship. See docs/providers.md and the /ship skill.
const emailProvider = (env.EMAIL_PROVIDER ?? "Dummy") as
  | "Dummy"
  | "Resend"
  | "SendGrid"
  | "Mailgun"
  | "SMTP";

const fromField = {
  name: env.EMAIL_FROM_NAME ?? "ProtoStack",
  email: env.EMAIL_FROM_ADDRESS ?? "noreply@example.com",
};

export default app({
  name: "ProtoStack",
  title: "ProtoStack",
  wasp: { version: "^0.25.0" },
  head: [
    "<meta name='viewport' content='width=device-width, initial-scale=1' />",
    "<link rel='icon' href='/favicon.svg' type='image/svg+xml' />",
    // CSP hardening: force any http subresource to https in production.
    "<meta http-equiv='Content-Security-Policy' content='upgrade-insecure-requests' />",
    // NOTE: any <script> added here MUST use `async`, not `defer` (React
    // hydration bug). See docs/deployment.md.
  ],
  auth: {
    userEntity: "User",
    methods: {
      email: {
        fromField,
        emailVerification: { clientRoute: "EmailVerificationRoute" },
        passwordReset: { clientRoute: "PasswordResetRoute" },
        userSignupFields: getEmailUserFields,
      },
      ...(googleEnabled
        ? {
            google: {
              userSignupFields: getGoogleUserFields,
              configFn: getGoogleAuthConfig,
            },
          }
        : {}),
    },
    onAuthFailedRedirectTo: "/login",
    onAuthSucceededRedirectTo: "/dashboard",
  },
  emailSender: {
    provider: emailProvider,
    defaultFrom: fromField,
  },
  client: {
    rootComponent: App,
  },
  spec: [
    route("LandingRoute", "/", page(LandingPage)),
    route("LoginRoute", "/login", page(Login)),
    route("SignupRoute", "/signup", page(Signup)),
    route(
      "RequestPasswordResetRoute",
      "/request-password-reset",
      page(RequestPasswordResetPage),
    ),
    route("PasswordResetRoute", "/password-reset", page(PasswordResetPage)),
    route(
      "EmailVerificationRoute",
      "/email-verification",
      page(EmailVerificationPage),
    ),
    route("DashboardRoute", "/dashboard", page(Dashboard, { authRequired: true })),
    route("AccountRoute", "/account", page(Account, { authRequired: true })),
    route("NotFoundRoute", "*", page(NotFoundPage)),

    action(updateDisplayName, { entities: ["User"] }),
  ],
});
