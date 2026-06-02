import * as Sentry from "@sentry/nextjs";

// Edge-runtime Sentry init (proxy / edge routes). No-ops without a DSN.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1,
  debug: false,
});
