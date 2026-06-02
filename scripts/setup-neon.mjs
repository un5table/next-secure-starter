#!/usr/bin/env node
// Provisions a dedicated Neon project for the opt-in "E2E (real Neon)" workflow,
// then prints the exact commands to wire up the GitHub repo. Everything here is
// self-service — nothing Neon-specific is baked into the template.
//
// Prereqs: `npm i -g neonctl` then `neonctl auth` (one-time browser login).
//
// Usage:
//   node scripts/setup-neon.mjs                       # interactive org pick
//   node scripts/setup-neon.mjs --org <org-id>        # non-interactive
//   node scripts/setup-neon.mjs --org <org-id> --name my-app-e2e
//
// The default E2E (ci.yml) needs NONE of this — it uses a throwaway Postgres
// container. Run this only if you want to additionally test against real Neon.

import { execFileSync } from "node:child_process";

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function run(cmd, args) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  });
}

const name = arg("--name", "next-secure-starter-e2e");
const org = arg("--org", null);

// 1. Confirm neonctl is installed + authenticated.
try {
  run("neonctl", ["me", "--output", "json"]);
} catch {
  console.error(
    "neonctl is not installed or not authenticated.\n" +
      "  npm i -g neonctl\n" +
      "  neonctl auth\n",
  );
  process.exit(1);
}

// 2. Create the project (org is required when your account has more than one).
const createArgs = ["projects", "create", "--name", name, "--output", "json"];
if (org) createArgs.push("--org-id", org);

console.error(`Creating Neon project "${name}"${org ? ` in ${org}` : ""}…`);
let project;
try {
  project = JSON.parse(run("neonctl", createArgs)).project;
} catch (e) {
  console.error(
    "\nProject creation failed. If the error mentions an organization, pass one:\n" +
      "  neonctl orgs list\n" +
      "  node scripts/setup-neon.mjs --org <org-id>\n" +
      "(Vercel-managed Neon orgs cannot be created in via the CLI — use a personal org.)\n",
  );
  if (e.stdout) console.error(e.stdout);
  process.exit(1);
}

const projectId = project.id;
console.log(`\n✓ Created Neon project: ${project.name} (${projectId})\n`);

// 3. neonctl can't mint API keys (its OAuth token lacks that scope), so the key
//    must come from the console. Print the remaining one-time wiring steps.
console.log("Next steps to enable the real-Neon E2E workflow:\n");
console.log("  1. Create a project-scoped API key in the Neon console:");
console.log(
  `     https://console.neon.tech/app/projects/${projectId}/settings/api-keys`,
);
console.log(
  "  2. Wire up the GitHub repo (replace <owner/repo> and the key):\n",
);
console.log(
  `     gh secret   set NEON_PROJECT_ID  --repo <owner/repo> --body ${projectId}`,
);
console.log(
  `     gh secret   set NEON_API_KEY     --repo <owner/repo> --body napi_yourkey`,
);
console.log(
  `     gh variable set ENABLE_NEON_E2E  --repo <owner/repo> --body true\n`,
);
console.log('  3. Run it:  Actions → "E2E (real Neon)" → Run workflow\n');
