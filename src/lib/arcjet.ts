import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/next";
import { env } from "@/env";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Unified, in-code abuse protection: WAF shield + bot detection + rate limiting in a
// single call. Active only when ARCJET_KEY is set; otherwise it falls back to the
// Upstash sliding-window limiter so guest endpoints always have *some* protection
// (and local dev / CI work with no Arcjet account). This complements Turnstile —
// Arcjet is the invisible bot/abuse layer, Turnstile the explicit human challenge.
const aj = env.ARCJET_KEY
  ? arcjet({
      key: env.ARCJET_KEY,
      characteristics: ["ip.src"],
      rules: [
        // Detects common attacks (SQLi, XSS, path traversal, ...).
        shield({ mode: "LIVE" }),
        // Blocks automated clients; allow well-behaved search-engine crawlers.
        detectBot({ mode: "LIVE", allow: ["CATEGORY:SEARCH_ENGINE"] }),
        // Per-IP sliding-window rate limit.
        slidingWindow({ mode: "LIVE", interval: "1h", max: 30 }),
      ],
    })
  : null;

type FallbackAction = Parameters<typeof checkRateLimit>[1];

export type ProtectResult =
  | { ok: true }
  | { ok: false; status: number; reason: string };

/**
 * Protects a guest-facing request. With Arcjet configured: shield + bot detection +
 * rate limiting. Without it: the Upstash limiter keyed by IP (action = fallbackAction).
 * Returns a discriminated result so callers can map it straight to an HTTP response.
 */
export async function protectRequest(
  request: Request,
  { fallbackAction }: { fallbackAction: FallbackAction },
): Promise<ProtectResult> {
  if (!aj) {
    const rl = await checkRateLimit(getClientIp(request), fallbackAction);
    return rl.allowed
      ? { ok: true }
      : { ok: false, status: 429, reason: rl.reason ?? "Rate limit exceeded." };
  }

  const decision = await aj.protect(request);
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        ok: false,
        status: 429,
        reason: "Rate limit exceeded. Please slow down.",
      };
    }
    if (decision.reason.isBot()) {
      return {
        ok: false,
        status: 403,
        reason: "Automated traffic is not allowed.",
      };
    }
    return { ok: false, status: 403, reason: "Request blocked." };
  }
  return { ok: true };
}
