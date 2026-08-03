import "server-only"

import { Ratelimit } from "@upstash/ratelimit"

import { redis } from "@/lib/redis"

/**
 * Rate limits for the write paths a boarder can hammer.
 *
 * These are abuse brakes, not business rules — the quotas and caps in
 * mess-config are what actually limit how many guest meals someone may book.
 * This stops the mechanical case: a stuck retry loop or someone spamming the
 * action.
 *
 * Sliding window, because a fixed window lets someone send a full burst at the
 * end of one window and again at the start of the next.
 */
function makeLimiter(tokens: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: "rl",
    // No analytics: it costs extra commands per request and the free plan
    // budget is commands, not memory.
    analytics: false,
  })
}

export const guestMealBookingLimiter = makeLimiter(10, "1 h")
export const mealToggleLimiter = makeLimiter(20, "1 h")

export type RateLimitVerdict =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

/**
 * Fail-open, like the cache: if Redis is unconfigured or unreachable, the
 * request proceeds. A rate limiter that takes the app down when it breaks is
 * worse than no rate limiter.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitVerdict> {
  if (!limiter) return { allowed: true }

  try {
    const { success, reset } = await limiter.limit(identifier)
    if (success) return { allowed: true }

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    }
  } catch (error) {
    console.error(`[ratelimit] check failed for ${identifier}:`, error)
    return { allowed: true }
  }
}

/** Human wording for a retry delay, for the toast a boarder sees. */
export function describeRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} second(s)`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute(s)`
}
