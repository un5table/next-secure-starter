import { NextRequest, NextResponse } from "next/server";

// Next.js 16 renamed middleware.ts -> proxy.ts (same API: `proxy` + `config`).
// This sets a per-request CSP nonce and the Content-Security-Policy header.
// IMPORTANT: do NOT put authorization logic here — enforce that in route handlers
// and the server data layer (see src/lib/auth-helpers.ts).
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16)),
  ).toString("base64");

  // Allow the browser SDK to POST events to Sentry's ingest only when configured.
  const sentry = process.env.NEXT_PUBLIC_SENTRY_DSN
    ? " https://*.sentry.io"
    : "";

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' lets scripts loaded by a nonced script (the React bundle)
    // load others. The explicit Cloudflare origin is a fallback for Turnstile.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' challenges.cloudflare.com`,
    // Inline styles are needed by Tailwind, next-themes, and component libraries.
    "style-src 'self' 'unsafe-inline'",
    // Allow HTTPS images for OAuth provider avatars.
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src 'self'${sentry}`,
    // Turnstile renders as an iframe from Cloudflare.
    "frame-src 'self' challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Violation reports go to our own endpoint and into AuditLog.
    "report-uri /api/csp-report",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // Start in report-only; flip to enforcing via CSP_MODE=enforcing (no code deploy).
  const cspHeader =
    process.env.CSP_MODE === "enforcing"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";
  response.headers.set(cspHeader, csp);
  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static assets.
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
