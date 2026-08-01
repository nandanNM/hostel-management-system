import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { describe, expect, it } from "vitest"

import {
  formatIST,
  istCalendarDay,
  istCalendarDayEnd,
  istCalendarMonthEnd,
  istCalendarMonthStart,
  istDateOnly,
  istEndOfDay,
  istParts,
  istStartOfDay,
  istStartOfDaysAgo,
  istYmd,
} from "./date"

const IST = "Asia/Kolkata"

const BOUNDARIES = [
  "2026-08-01T18:29:00.000Z",
  "2026-08-01T18:30:00.000Z",
  "2026-08-01T18:31:00.000Z",
  "2026-08-01T00:15:00.000Z",
  "2026-08-01T23:59:59.000Z",
  "2026-12-31T19:00:00.000Z",
  "2026-03-15T12:00:00.000Z",
] as const

describe("formatIST", () => {
  it("renders the India day, not the UTC day", () => {
    expect(formatIST("2026-08-01T18:30:00.000Z", "dd/MM/yyyy")).toBe(
      "02/08/2026"
    )
    expect(formatIST("2026-08-01T18:29:00.000Z", "dd/MM/yyyy")).toBe(
      "01/08/2026"
    )
  })

  it("is independent of the process timezone", () => {
    const original = process.env.TZ
    const results = ["UTC", "Asia/Kolkata", "America/New_York"].map((tz) => {
      process.env.TZ = tz
      return formatIST("2026-08-01T18:30:00.000Z", "yyyy-MM-dd HH:mm")
    })
    process.env.TZ = original

    expect(new Set(results).size).toBe(1)
  })
})

describe("istParts / istYmd", () => {
  it("reports India calendar parts", () => {
    expect(istYmd("2026-12-31T19:00:00.000Z")).toBe("2027-01-01")
    expect(istParts("2026-12-31T19:00:00.000Z")).toEqual({
      year: 2027,
      month: 0,
      day: 1,
    })
  })
})

describe("istStartOfDay / istEndOfDay", () => {
  it("returns the real instants bounding the India day", () => {
    expect(istStartOfDay("2026-08-02T04:00:00.000Z").toISOString()).toBe(
      "2026-08-01T18:30:00.000Z"
    )
    expect(istEndOfDay("2026-08-02T04:00:00.000Z").toISOString()).toBe(
      "2026-08-02T18:29:59.999Z"
    )
  })

  it("covers the whole day and nothing more", () => {
    const start = istStartOfDay("2026-08-02T04:00:00.000Z")
    const end = istEndOfDay("2026-08-02T04:00:00.000Z")
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000 - 1)
  })

  it("includes entries logged just after midnight IST", () => {
    // The regression this replaced: a UTC-midnight lower bound started the
    // window at 05:30 IST and dropped early-morning activity logs.
    const justAfterMidnightIST = new Date("2026-08-01T18:35:00.000Z")
    expect(
      istStartOfDaysAgo(0, "2026-08-02T04:00:00.000Z") <= justAfterMidnightIST
    ).toBe(true)
  })

  it("walks back whole India days", () => {
    const from = istStartOfDaysAgo(6, "2026-08-02T04:00:00.000Z")
    expect(from.toISOString()).toBe("2026-07-26T18:30:00.000Z")
  })
})

describe("istCalendarDay (day-key columns)", () => {
  it("is UTC midnight of the India day", () => {
    expect(istCalendarDay("2026-08-01T18:30:00.000Z").toISOString()).toBe(
      "2026-08-02T00:00:00.000Z"
    )
    expect(istCalendarDay("2026-08-01T18:29:00.000Z").toISOString()).toBe(
      "2026-08-01T00:00:00.000Z"
    )
  })

  it.each(BOUNDARIES)(
    "matches the value production already stores for %s",
    (instant) => {
      const now = new Date(instant)
      const legacy = startOfDay(toZonedTime(now, IST))
      expect(istCalendarDay(now).getTime()).toBe(legacy.getTime())

      const legacyEnd = endOfDay(toZonedTime(now, IST))
      expect(istCalendarDayEnd(now).getTime()).toBe(legacyEnd.getTime())
    }
  )

  it.each(["UTC", "Asia/Kolkata", "America/New_York"])(
    "produces the same day-key under TZ=%s",
    (tz) => {
      const original = process.env.TZ
      process.env.TZ = tz
      const key = istCalendarDay("2026-08-01T12:00:00.000Z").toISOString()
      process.env.TZ = original
      expect(key).toBe("2026-08-01T00:00:00.000Z")
    }
  )
})

describe("istCalendarMonthStart / istCalendarMonthEnd", () => {
  it("brackets the month inclusively", () => {
    expect(istCalendarMonthStart(2026, 7).toISOString()).toBe(
      "2026-08-01T00:00:00.000Z"
    )
    expect(istCalendarMonthEnd(2026, 7).toISOString()).toBe(
      "2026-08-31T23:59:59.999Z"
    )
  })

  it("rolls over December correctly", () => {
    expect(istCalendarMonthEnd(2026, 11).toISOString()).toBe(
      "2026-12-31T23:59:59.999Z"
    )
    expect(istCalendarMonthStart(2027, 0).toISOString()).toBe(
      "2027-01-01T00:00:00.000Z"
    )
  })

  it.each(BOUNDARIES)("matches the legacy month bounds for %s", (instant) => {
    const zoned = toZonedTime(new Date(instant), IST)
    const legacyBase = new Date(zoned.getFullYear(), zoned.getMonth(), 1)
    const { year, month } = istParts(instant)

    expect(istCalendarMonthStart(year, month).getTime()).toBe(
      startOfMonth(legacyBase).getTime()
    )
    expect(istCalendarMonthEnd(year, month).getTime()).toBe(
      endOfMonth(legacyBase).getTime()
    )
  })
})

describe("istDateOnly (date of birth)", () => {
  it("keeps the day the user picked", () => {
    const picked = new Date("2004-04-21T18:30:00.000Z")
    const stored = istDateOnly(picked)

    expect(stored.toISOString()).toBe("2004-04-22T00:00:00.000Z")
    expect(formatIST(stored, "dd/MM/yyyy")).toBe("22/04/2004")
  })

  it("reads rows written before the fix as the correct day", () => {
    const legacyRow = new Date("2004-04-21T18:30:00.000Z")
    expect(formatIST(legacyRow, "dd/MM/yyyy")).toBe("22/04/2004")
  })

  it("is idempotent", () => {
    const once = istDateOnly("2004-04-21T18:30:00.000Z")
    expect(istDateOnly(once).getTime()).toBe(once.getTime())
  })
})
