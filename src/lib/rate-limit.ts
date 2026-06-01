import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

// Limits per action, per key (IP or email), using a sliding window.
// Tune these to your endpoints. Add a new action here, then call checkRateLimit.
const LIMITS = {
  create_resource: { requests: 10, window: "1 h" },
  credentials_signin: { requests: 5, window: "15 m" },
  forgot_password: { requests: 5, window: "15 m" },
  reset_password: { requests: 5, window: "15 m" },
  accept_invite: { requests: 5, window: "15 m" },
} as const;

type Action = keyof typeof LIMITS;

let redis: Redis | null = null;
const limiters = new Map<Action, Ratelimit>();

function getLimiter(action: Action): Ratelimit | null {
  if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) {
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: env.KV_REST_API_URL,
      token: env.KV_REST_API_TOKEN,
    });
  }

  if (!limiters.has(action)) {
    const { requests, window } = LIMITS[action];
    limiters.set(
      action,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, window),
        prefix: `app:rl:${action}`,
      }),
    );
  }

  return limiters.get(action)!;
}

export async function checkRateLimit(
  key: string,
  action: Action,
): Promise<{ allowed: boolean; reason?: string }> {
  const limiter = getLimiter(action);
  if (!limiter) {
    // KV not configured — open in dev. Configure Upstash before production.
    return { allowed: true };
  }

  const { success, remaining, reset } = await limiter.limit(key);
  if (!success) {
    const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
    return {
      allowed: false,
      reason: `Rate limit exceeded. Try again in ${retryAfterSec}s (${remaining} remaining).`,
    };
  }

  return { allowed: true };
}

/**
 * Extract the caller's IP from a request.
 * Prefers x-real-ip (set by Vercel to the actual client IP, non-spoofable)
 * over x-forwarded-for (can be prefixed by an attacker-controlled value).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown"
  );
}
