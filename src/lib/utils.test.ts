import { describe, expect, it } from "vitest"

import { formatDate, getCurrentMealSlot, isActiveTime } from "./utils"

describe("getCurrentMealSlot", () => {
  it("splits the day on India noon, not UTC noon", () => {
    expect(getCurrentMealSlot(new Date("2026-08-01T06:29:00.000Z"))).toBe(
      "LUNCH"
    )
    expect(getCurrentMealSlot(new Date("2026-08-01T06:30:00.000Z"))).toBe(
      "DINNER"
    )
  })

  it("treats early-morning IST as lunch", () => {
    expect(getCurrentMealSlot(new Date("2026-08-01T20:00:00.000Z"))).toBe(
      "LUNCH"
    )
  })
})

describe("formatDate", () => {
  it("renders the India day by default", () => {
    expect(formatDate("2026-08-01T18:30:00.000Z")).toBe("August 2, 2026")
    expect(formatDate("2026-08-01T18:29:00.000Z")).toBe("August 1, 2026")
  })

  it("still honours an explicit timeZone override", () => {
    expect(formatDate("2026-08-01T18:30:00.000Z", { timeZone: "UTC" })).toBe(
      "August 1, 2026"
    )
  })
})

describe("isActiveTime", () => {
  it("uses India hours for the inactive windows", () => {
    // 07:00 IST (01:30Z) falls in the 06:00-12:00 IST inactive window.
    expect(isActiveTime(new Date("2026-08-01T01:30:00.000Z"))).toBe(false)
    // 13:00 IST (07:30Z) is active.
    expect(isActiveTime(new Date("2026-08-01T07:30:00.000Z"))).toBe(true)
    // 19:00 IST (13:30Z) falls in the 18:00-24:00 IST inactive window.
    expect(isActiveTime(new Date("2026-08-01T13:30:00.000Z"))).toBe(false)
  })
})
