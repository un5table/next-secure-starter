import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
// Validate environment variables at build/startup (fail fast on missing/invalid).
import "./src/env";

// Static security headers applied to every route. The dynamic CSP (with a
// per-request nonce) lives in src/proxy.ts.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Modern browsers ignore the legacy XSS auditor; 0 disables a known footgun.
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

// Sentry wraps the config to instrument the build. It's inert without a DSN; source
// maps upload only when SENTRY_AUTH_TOKEN is set (so installs/CI stay lean & green).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  disableLogger: true,
});
