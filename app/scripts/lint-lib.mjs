/*
 * Shared helpers for brand-lint and security-lint. Dependency-free.
 *
 * Both linters follow the same contract as skillfront's brand-lint: scan
 * source, collect violations with file:line, print them, exit non-zero if any.
 * Every rule corresponds to something that has actually shipped broken.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".wasp" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

// Strip comments so example code inside a doc comment doesn't trip a
// forbidden-pattern rule. Protocol-relative `//` (e.g. https://) is preserved.
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_, p) => p);
}

export function lineOf(src, index) {
  return src.slice(0, index).split("\n").length;
}

// The full source line containing `index` — for rules whose exemption depends
// on same-line context (e.g. `font-mono` allowed only inside a <code> element).
export function lineTextOf(src, index) {
  const start = src.lastIndexOf("\n", index - 1) + 1;
  const end = src.indexOf("\n", index);
  return src.slice(start, end === -1 ? src.length : end);
}

export class Reporter {
  constructor(appRoot) {
    this.appRoot = appRoot;
    this.violations = [];
  }

  add(file, line, rule, message) {
    this.violations.push({ file: relative(this.appRoot, file), line, rule, message });
  }

  // Scan `text` for every match of `re` and report it. `skip(match, text)`, if
  // given, suppresses a match when it returns true — for exemptions that depend
  // on the match's context rather than the file.
  scan(file, text, re, rule, message, skip) {
    let m;
    const rx = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    while ((m = rx.exec(text))) {
      if (skip && skip(m, text)) continue;
      this.add(file, lineOf(text, m.index), rule, typeof message === "function" ? message(m) : message);
    }
  }

  finish(label) {
    if (this.violations.length === 0) {
      console.log(`✓ ${label}: clean.`);
      return;
    }
    this.violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
    console.error(`✗ ${label}: ${this.violations.length} issue(s)\n`);
    for (const v of this.violations) {
      console.error(`  ${v.file}:${v.line}  [${v.rule}] ${v.message}`);
    }
    process.exit(1);
  }
}

export function readConfig(appRoot) {
  return JSON.parse(readFileSync(join(appRoot, "src/brand/brand.config.json"), "utf8"));
}
