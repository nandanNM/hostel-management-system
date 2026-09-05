import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/redis", () => ({ redis: null, isRedisEnabled: false }))

const { checkRateLimit, describeRetryAfter } = await import("@/lib/ratelimit")

describe("checkRateLimit", () => {
  it("allows the request when Redis is not configured", async () => {
    await expect(checkRateLimit(null, "user:1")).resolves.toEqual({
      allowed: true,
    })
  })

  it("allows the request when the limiter throws", async () => {
    const broken = {
      limit: () => Promise.reject(new Error("redis down")),
    } as never
    await expect(checkRateLimit(broken, "user:1")).resolves.toEqual({
      allowed: true,
    })
  })

  it("blocks and reports when to retry", async () => {
    const reset = Date.now() + 90_000
    const limiter = {
      limit: () => Promise.resolve({ success: false, reset }),
    } as never

    const verdict = await checkRateLimit(limiter, "user:1")
    expect(verdict.allowed).toBe(false)
    expect(
      verdict.allowed === false && verdict.retryAfterSeconds
    ).toBeGreaterThan(80)
  })

  it("never reports a retry delay below one second", async () => {
    const limiter = {
      limit: () =>
        Promise.resolve({ success: false, reset: Date.now() - 5000 }),
    } as never
    const verdict = await checkRateLimit(limiter, "user:1")
    expect(verdict.allowed === false && verdict.retryAfterSeconds).toBe(1)
  })
})

describe("describeRetryAfter", () => {
  it("uses seconds under a minute and rounds minutes up", () => {
    expect(describeRetryAfter(30)).toBe("30 second(s)")
    expect(describeRetryAfter(61)).toBe("2 minute(s)")
    expect(describeRetryAfter(120)).toBe("2 minute(s)")
  })
})
