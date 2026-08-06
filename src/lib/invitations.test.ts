import { describe, expect, it } from "vitest"

import {
  createInviteToken,
  inviteMatchesAccount,
  inviteUrl,
  normaliseEmail,
  verifyInviteToken,
} from "./invitations"

const SECRET = "test-secret"
const NOW = new Date("2026-08-07T00:00:00.000Z")

describe("createInviteToken / verifyInviteToken", () => {
  it("round-trips the payload", () => {
    const token = createInviteToken(
      { email: "Guest@Gmail.com ", stayUntil: "2026-09-06" },
      SECRET,
      NOW
    )
    const verdict = verifyInviteToken(token, SECRET, NOW)

    expect(verdict.valid).toBe(true)
    expect(verdict.valid && verdict.payload).toMatchObject({
      email: "guest@gmail.com",
      temporary: true,
      stayUntil: "2026-09-06",
    })
  })

  it("rejects a token signed with a different secret", () => {
    const token = createInviteToken({ email: "a@b.com" }, SECRET, NOW)
    const verdict = verifyInviteToken(token, "other-secret", NOW)
    expect(verdict).toEqual({ valid: false, reason: "bad-signature" })
  })

  it("rejects a tampered payload", () => {
    const token = createInviteToken({ email: "a@b.com" }, SECRET, NOW)
    const [, signature] = token.split(".")
    const forged = `${Buffer.from(
      JSON.stringify({
        email: "attacker@b.com",
        temporary: true,
        stayUntil: null,
        exp: 99999999999,
      })
    ).toString("base64url")}.${signature}`

    expect(verifyInviteToken(forged, SECRET, NOW).valid).toBe(false)
  })

  it("expires", () => {
    const token = createInviteToken(
      { email: "a@b.com", ttlDays: 1 },
      SECRET,
      NOW
    )
    const withinWindow = new Date(NOW.getTime() + 23 * 60 * 60 * 1000)
    const afterWindow = new Date(NOW.getTime() + 25 * 60 * 60 * 1000)

    expect(verifyInviteToken(token, SECRET, withinWindow).valid).toBe(true)
    expect(verifyInviteToken(token, SECRET, afterWindow)).toEqual({
      valid: false,
      reason: "expired",
    })
  })

  it.each(["", "no-dot", "a.b.c", "onlybody."])(
    "rejects malformed token %j",
    (token) => {
      expect(verifyInviteToken(token, SECRET, NOW).valid).toBe(false)
    }
  )

  it("refuses to sign without a secret", () => {
    expect(() => createInviteToken({ email: "a@b.com" }, "", NOW)).toThrow()
  })
})

describe("inviteMatchesAccount", () => {
  const payload = {
    email: "guest@gmail.com",
    temporary: true,
    stayUntil: null,
    exp: 99999999999,
  }

  it("matches regardless of case or padding", () => {
    expect(inviteMatchesAccount(payload, " Guest@Gmail.com ")).toBe(true)
  })

  it("rejects a forwarded link used by someone else", () => {
    expect(inviteMatchesAccount(payload, "someone@else.com")).toBe(false)
    expect(inviteMatchesAccount(payload, null)).toBe(false)
  })
})

describe("helpers", () => {
  it("normalises emails", () => {
    expect(normaliseEmail("  A@B.COM ")).toBe("a@b.com")
  })

  it("builds a link without a double slash", () => {
    expect(inviteUrl("https://x.dev/", "tok")).toBe("https://x.dev/invite/tok")
  })
})
