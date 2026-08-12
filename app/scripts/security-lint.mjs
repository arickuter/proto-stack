#!/usr/bin/env node
/*
 * security-lint — the machine-checkable half of docs/security.md.
 *
 *   node scripts/security-lint.mjs
 *
 * These rules catch the security mistakes that are easy to make in a Wasp
 * prototype and expensive to notice: an operation with no auth check (Wasp
 * exposes a callable endpoint for every one), an unvalidated input, a leaked
 * secret, HTML injection, or an env file that isn't git-ignored. The judgment
 * calls that can't be linted (IDOR scoping, authz-vs-authn) live in
 * docs/security.md and are enforced by the /prototype and /ship skills.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { walk, stripComments, Reporter, lineOf } from "./lint-lib.mjs";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP, "src");
const r = new Reporter(APP);
const rel = (f) => relative(APP, f).replace(/\\/g, "/");

const files = walk(SRC, [".ts", ".tsx"]);

const SECRET_PATTERNS = [
  [/sk_(live|test)_[A-Za-z0-9]{8,}/, "Stripe secret key"],
  [/whsec_[A-Za-z0-9]{8,}/, "Stripe webhook secret"],
  [/\bre_[A-Za-z0-9]{16,}/, "Resend API key"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key id"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key (PEM)"],
];

function markerBefore(raw, index, marker) {
  const before = raw.slice(Math.max(0, index - 220), index);
  return before.includes(marker);
}

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const src = stripComments(raw);
  const relPath = rel(file);
  const isClient = relPath.startsWith("src/client/") || file.endsWith(".tsx");

  // 1. No HTML injection sink.
  r.scan(file, src, /dangerouslySetInnerHTML/, "no-dangerous-html",
    "dangerouslySetInnerHTML — render user content with <ReactMarkdown> instead");

  // 2. No hardcoded secrets anywhere in src/.
  for (const [re, what] of SECRET_PATTERNS) {
    r.scan(file, src, re, "hardcoded-secret",
      () => `looks like a ${what} in source — secrets belong in .env.server / host env only`);
  }

  // 3. Server env must not be read from client code.
  if (isClient) {
    r.scan(file, src, /process\.env/, "no-server-env-in-client",
      "process.env in client code — server env never reaches the browser (use wasp/client env or REACT_APP_*)");
  }

  // 4. Public client env vars must not be named like secrets.
  r.scan(file, src, /REACT_APP_[A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD)/, "public-env-named-secret",
    (m) => `${m[0]} is exposed to the browser — a REACT_APP_* var must never hold a secret`);

  // 5. Client-side fetch to a hardcoded third-party origin (keep calls server-side).
  if (isClient) {
    let m;
    const rx = /fetch\(\s*[`'"]https?:\/\//g;
    while ((m = rx.exec(raw))) {
      if (!markerBefore(raw, m.index, "external-api:")) {
        r.add(file, lineOf(raw, m.index), "client-external-fetch",
          "client fetch to an external origin — call it from an operation, or mark `// external-api:`");
      }
    }
  }

  // 6. Every exported operation is auth-checked and input-validated.
  if (file.endsWith("operations.ts")) {
    const exportRe = /export\s+(?:async\s+)?(?:const|function)\s+([A-Za-z0-9_]+)/g;
    const marks = [...raw.matchAll(exportRe)].map((m) => ({ name: m[1], index: m.index }));
    for (let i = 0; i < marks.length; i++) {
      const { name, index } = marks[i];
      const end = i + 1 < marks.length ? marks[i + 1].index : raw.length;
      const segment = raw.slice(index, end);
      if (!/=>|function/.test(segment)) continue; // not a function export

      const authed = /context\.user/.test(segment) || markerBefore(raw, index, "public-operation:");
      const validated = /\.(safe)?parse\(/.test(segment) || markerBefore(raw, index, "no-input:");
      if (!authed) {
        r.add(file, lineOf(raw, index), "operation-auth",
          `operation "${name}" never checks context.user — add the auth guard, or mark it // public-operation:`);
      }
      if (!validated) {
        r.add(file, lineOf(raw, index), "operation-input",
          `operation "${name}" does not zod-parse its args — validate input, or mark it // no-input:`);
      }
    }
  }
}

// 7. Env files must be git-ignored.
const gitignorePath = existsSync(join(APP, ".gitignore"))
  ? join(APP, ".gitignore")
  : join(APP, "..", ".gitignore");
if (existsSync(gitignorePath)) {
  const gi = readFileSync(gitignorePath, "utf8");
  const ignoresEnv = /^\s*\.env(\.\*)?\s*$/m.test(gi) || /^\s*\.env\.server\s*$/m.test(gi);
  if (!ignoresEnv) {
    r.add(gitignorePath, 1, "env-not-ignored",
      ".gitignore does not ignore .env / .env.* — a secret file could be committed");
  }
  if (/^\s*!\.env\.server\s*$/m.test(gi) || /^\s*!\.env\.\*\s*$/m.test(gi)) {
    r.add(gitignorePath, 1, "env-unignored",
      ".gitignore un-ignores an env file (a `!` rule) — .env.server must stay ignored");
  }
} else {
  r.add(APP, 1, "env-not-ignored", "no .gitignore found — .env.server must be git-ignored");
}

r.finish("security-lint");
