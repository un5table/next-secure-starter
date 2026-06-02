#!/usr/bin/env node
// Rebrand the template for a new project in one shot. Rewrites the app identity
// across .env.example, package.json, src/lib/site.ts, and the README H1.
//
// Usage:
//   node scripts/rename.mjs "My App"
//   node scripts/rename.mjs "My App" --color "#7c3aed" --url "https://myapp.com"
//   node scripts/rename.mjs "My App" --pkg my-app   # override the package name
//
// Review the diff afterwards (git diff) — this touches a handful of files and
// intentionally leaves your own copy (.env.local, deployed env vars) alone.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

function flag(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const displayName =
  process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;

if (!displayName) {
  console.error(
    'Usage: node scripts/rename.mjs "My App" [--color "#hex"] [--url "https://…"] [--pkg my-app]',
  );
  process.exit(1);
}

const kebab = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const pkgName = flag("pkg") ?? kebab(displayName);
const color = flag("color");
const url = flag("url");

const edits = [];
function edit(path, fn) {
  if (!existsSync(path)) return;
  const before = readFileSync(path, "utf8");
  const after = fn(before);
  if (after !== before) {
    writeFileSync(path, after);
    edits.push(path);
  }
}

// package.json — name only (keep everything else).
edit("package.json", (s) => {
  const pkg = JSON.parse(s);
  pkg.name = pkgName;
  return JSON.stringify(pkg, null, 2) + "\n";
});

// .env.example — app identity defaults.
edit(".env.example", (s) => {
  s = s.replace(
    /^NEXT_PUBLIC_APP_NAME=.*$/m,
    `NEXT_PUBLIC_APP_NAME="${displayName}"`,
  );
  if (color)
    s = s.replace(
      /^NEXT_PUBLIC_BRAND_COLOR=.*$/m,
      `NEXT_PUBLIC_BRAND_COLOR="${color}"`,
    );
  if (url) {
    s = s.replace(/^NEXT_PUBLIC_APP_URL=.*$/m, `NEXT_PUBLIC_APP_URL="${url}"`);
    s = s.replace(/^AUTH_URL=.*$/m, `AUTH_URL="${url}"`);
  }
  return s;
});

// src/lib/site.ts — the hard-coded fallback name.
edit("src/lib/site.ts", (s) =>
  s.replace(/"Secure Starter"/g, `"${displayName}"`),
);

// README.md — the H1 title.
edit("README.md", (s) => s.replace(/^# .*$/m, `# ${pkgName}`));

console.log(`\nRebranded to "${displayName}" (package: ${pkgName}).`);
if (color) console.log(`  brand color: ${color}`);
if (url) console.log(`  url: ${url}`);
console.log(
  edits.length
    ? `\nUpdated:\n${edits.map((f) => `  - ${f}`).join("\n")}\n\nReview with \`git diff\`, then set the same NEXT_PUBLIC_* values in .env.local and your host.`
    : "\nNothing changed (already renamed?).",
);
