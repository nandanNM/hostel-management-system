import "server-only"

import { istYmd } from "@/lib/date"
import { redis } from "@/lib/redis"

/**
 * Cache keys. Namespaced and versioned: bumping the version retires every old
 * entry at once, which is cheaper and safer than trying to delete them.
 */
const V = "v1"

export const cacheKeys = {
  /** One key for everyone - the leaderboard is identical for every boarder. */
  leaderboard: (year: number, month: number) =>
    `${V}:leaderboard:${year}-${String(month + 1).padStart(2, "0")}`,
  /** Changes at most once per India day. */
  birthdays: (day: string = istYmd()) => `${V}:birthdays:${day}`,
  /** One row, read on every booking interaction and every count generation. */
  messConfig: () => `${V}:mess-config`,
  /** 14 rows total, read whenever the booking form or the count needs a menu. */
  mealSchedule: (dayOfWeek: string, mealTime: string) =>
    `${V}:meal-schedule:${dayOfWeek}:${mealTime}`,
} as const

/** Every meal schedule key, for clearing the lot after a menu edit. */
export function mealScheduleKeys(): string[] {
  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]
  return days.flatMap((day) =>
    ["LUNCH", "DINNER"].map((slot) => cacheKeys.mealSchedule(day, slot))
  )
}

/**
 * Cache-aside with fail-open semantics.
 *
 * A Redis outage, a missing env var or a serialisation problem must never turn
 * into a failed request: every error falls through to `fetchFresh()`. The cache
 * only ever makes things faster, never breaks them.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetchFresh: () => Promise<T>
): Promise<T> {
  if (!redis) return fetchFresh()

  try {
    const hit = await redis.get<T>(key)
    if (hit !== null && hit !== undefined) return hit
  } catch (error) {
    console.error(`[cache] read failed for ${key}:`, error)
    return fetchFresh()
  }

  const fresh = await fetchFresh()

  try {
    // Fire-and-forget would be cheaper, but awaiting keeps the serverless
    // function alive long enough for the write to actually land.
    await redis.set(key, fresh, { ex: ttlSeconds })
  } catch (error) {
    console.error(`[cache] write failed for ${key}:`, error)
  }

  return fresh
}

/** Drop a key. Silently ignored when Redis is not configured. */
export async function invalidate(...keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return

  try {
    await redis.del(...keys)
  } catch (error) {
    console.error(`[cache] invalidate failed for ${keys.join(", ")}:`, error)
  }
}

/** Seconds until the next India midnight, floored at one minute. */
export function secondsUntilIstMidnight(now: Date = new Date()): number {
  const nextMidnight = new Date(`${istYmd(now)}T00:00:00.000Z`)
  nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1)

  // istYmd-based keys roll at IST midnight, which is 18:30Z the day before.
  const rollAt = nextMidnight.getTime() - 5.5 * 60 * 60 * 1000
  const seconds = Math.ceil((rollAt - now.getTime()) / 1000)

  return Math.max(60, seconds)
}
