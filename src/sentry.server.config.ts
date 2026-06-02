import * as Sentry from "@sentry/nextjs";

// Server-side Sentry init. No-ops entirely when NEXT_PUBLIC_SENTRY_DSN is unset.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NODE_ENV,
  // Tune down in production once you understand your volume.
  tracesSampleRate: 1,
  // Don't print the Sentry init banner / breadcrumbs noise in dev.
  debug: false,
});
