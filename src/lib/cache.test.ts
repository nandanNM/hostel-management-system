import { describe, expect, it, vi } from "vitest"

// The module imports "server-only", which throws outside a server component
// context, and reads the Redis env vars at import time.
vi.mock("server-only", () => ({}))
vi.mock("./redis", () => ({ redis: null, isRedisEnabled: false }))

const { cacheKeys, cached, secondsUntilIstMidnight } = await import("./cache")

describe("cacheKeys", () => {
  it("uses one key per month for the whole hostel", () => {
    expect(cacheKeys.leaderboard(2026, 7)).toBe("v1:leaderboard:2026-08")
    // Not per user: two boarders must resolve to the same key.
    expect(cacheKeys.leaderboard(2026, 7)).toBe(cacheKeys.leaderboard(2026, 7))
  })

  it("pads the month so keys sort correctly", () => {
    expect(cacheKeys.leaderboard(2026, 0)).toBe("v1:leaderboard:2026-01")
  })

  it("keys birthdays by the India day", () => {
    expect(cacheKeys.birthdays("2026-08-03")).toBe("v1:birthdays:2026-08-03")
  })
})

describe("cached (Redis not configured)", () => {
  it("falls through to the fetcher instead of failing", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    await expect(cached("k", 60, fetcher)).resolves.toEqual({ ok: true })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it("propagates a real fetch error rather than swallowing it", async () => {
    const boom = new Error("db down")
    await expect(cached("k", 60, () => Promise.reject(boom))).rejects.toThrow(
      "db down"
    )
  })
})

describe("secondsUntilIstMidnight", () => {
  it("counts down to the next India midnight", () => {
    // 18:00 IST on 1 Aug -> 6 hours left
    const at1800Ist = new Date("2026-08-01T12:30:00.000Z")
    expect(secondsUntilIstMidnight(at1800Ist)).toBe(6 * 60 * 60)
  })

  it("never returns less than a minute", () => {
    // One second before IST midnight
    const justBefore = new Date("2026-08-01T18:29:59.000Z")
    expect(secondsUntilIstMidnight(justBefore)).toBeGreaterThanOrEqual(60)
  })

  it("is a full day right after the roll", () => {
    const justAfter = new Date("2026-08-01T18:30:01.000Z")
    expect(secondsUntilIstMidnight(justAfter)).toBeGreaterThan(23 * 60 * 60)
    expect(secondsUntilIstMidnight(justAfter)).toBeLessThanOrEqual(24 * 60 * 60)
  })
})
