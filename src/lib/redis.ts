import "server-only"

import { Redis } from "@upstash/redis"

/**
 * Upstash Redis, or null when it is not configured.
 *
 * Caching here is an optimisation, never a dependency: local development and
 * any deployment without the two env vars must keep working, just without the
 * cache. Every caller goes through `cached()` in @/lib/cache, which treats a
 * null client as a permanent cache miss.
 */
function createClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  return new Redis({
    url,
    token,
    // One retry: a cache read is not worth holding a request open for.
    retry: { retries: 1, backoff: () => 50 },
  })
}

export const redis = createClient()

export const isRedisEnabled = redis !== null
