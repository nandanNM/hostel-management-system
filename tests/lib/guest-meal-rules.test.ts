import { describe, expect, it } from "vitest"

import {
  buildGuestMealPricing,
  checkBookingWindow,
  checkGuestsPerBooking,
  checkMonthlyGuestQuota,
  guestChoiceKey,
  guestChoicesFor,
  istMinuteOfDay,
  resolveGuestMealCharge,
  resolveScheduledMealPrice,
} from "@/lib/guest-meal-rules"

const CONFIG = {
  guestBookingMaxDaysAhead: 7,
  guestBookingCutoffMinutes: 120,
  lunchStartMinute: 12 * 60 + 30,
  dinnerStartMinute: 20 * 60 + 30,
}

// 08:00 IST on 1 Aug 2026 == 02:30Z
const MORNING = new Date("2026-08-01T02:30:00.000Z")

describe("istMinuteOfDay", () => {
  it("reads the clock in India, not UTC", () => {
    expect(istMinuteOfDay(MORNING)).toBe(8 * 60)
    // 20:00Z is 01:30 IST the next day
    expect(istMinuteOfDay(new Date("2026-08-01T20:00:00.000Z"))).toBe(90)
  })
})

describe("checkBookingWindow", () => {
  it("accepts a booking placed well before the slot", () => {
    expect(
      checkBookingWindow(
        new Date("2026-08-01T06:00:00.000Z"),
        "LUNCH",
        CONFIG,
        MORNING
      )
    ).toEqual({ ok: true })
  })

  it("rejects a past date", () => {
    const result = checkBookingWindow(
      new Date("2026-07-31T06:00:00.000Z"),
      "LUNCH",
      CONFIG,
      MORNING
    )
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toMatch(/already passed/)
  })

  it("rejects a date beyond the horizon but accepts the last allowed day", () => {
    const day7 = new Date("2026-08-08T06:00:00.000Z")
    const day8 = new Date("2026-08-09T06:00:00.000Z")
    expect(checkBookingWindow(day7, "LUNCH", CONFIG, MORNING).ok).toBe(true)
    expect(checkBookingWindow(day8, "LUNCH", CONFIG, MORNING).ok).toBe(false)
  })

  it("closes same-day lunch bookings at the cutoff", () => {
    // Lunch starts 12:30 IST, cutoff 120 min -> closes 10:30 IST
    const at1029 = new Date("2026-08-01T04:59:00.000Z") // 10:29 IST
    const at1031 = new Date("2026-08-01T05:01:00.000Z") // 10:31 IST
    const today = new Date("2026-08-01T06:00:00.000Z")

    expect(checkBookingWindow(today, "LUNCH", CONFIG, at1029).ok).toBe(true)
    const late = checkBookingWindow(today, "LUNCH", CONFIG, at1031)
    expect(late.ok).toBe(false)
    expect(late.ok === false && late.reason).toContain("10:30 AM")
  })

  it("uses the dinner slot for dinner", () => {
    // Dinner starts 20:30 IST -> closes 18:30 IST
    const at1800 = new Date("2026-08-01T12:30:00.000Z") // 18:00 IST
    const today = new Date("2026-08-01T06:00:00.000Z")
    expect(checkBookingWindow(today, "DINNER", CONFIG, at1800).ok).toBe(true)
    expect(checkBookingWindow(today, "LUNCH", CONFIG, at1800).ok).toBe(false)
  })

  it("does not apply the cutoff to future days", () => {
    const lateAtNight = new Date("2026-08-01T17:00:00.000Z") // 22:30 IST
    const tomorrow = new Date("2026-08-02T06:00:00.000Z")
    expect(checkBookingWindow(tomorrow, "LUNCH", CONFIG, lateAtNight).ok).toBe(
      true
    )
  })

  it("treats a horizon of 0 as today only", () => {
    const config = { ...CONFIG, guestBookingMaxDaysAhead: 0 }
    const tomorrow = new Date("2026-08-02T06:00:00.000Z")
    expect(checkBookingWindow(tomorrow, "LUNCH", config, MORNING).ok).toBe(
      false
    )
  })
})

describe("checkGuestsPerBooking", () => {
  it("allows up to the cap and rejects above it", () => {
    expect(checkGuestsPerBooking(5, 5)).toEqual({ ok: true })
    expect(checkGuestsPerBooking(6, 5).ok).toBe(false)
  })

  it("treats 0 as no cap", () => {
    expect(checkGuestsPerBooking(99, 0)).toEqual({ ok: true })
  })
})

describe("checkMonthlyGuestQuota", () => {
  it("allows a request that exactly fills the quota", () => {
    expect(checkMonthlyGuestQuota(18, 2, 20)).toEqual({ ok: true })
  })

  it("rejects a request that would exceed it, and says what is left", () => {
    const result = checkMonthlyGuestQuota(18, 3, 20)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toContain(
      "2 guest meal(s) left"
    )
  })

  it("reports an exhausted quota differently", () => {
    const result = checkMonthlyGuestQuota(20, 1, 20)
    expect(result.ok === false && result.reason).toMatch(/used your 20/)
  })

  it("treats 0 as no cap", () => {
    expect(checkMonthlyGuestQuota(500, 10, 0)).toEqual({ ok: true })
  })
})

describe("resolveGuestMealCharge", () => {
  it("prefers the prefect's rate", () => {
    expect(
      resolveGuestMealCharge({ rate: 70, menuItemCost: 55, fallback: 60 })
    ).toBe(70)
  })

  it("falls back to the menu item cost, then the configured default", () => {
    expect(
      resolveGuestMealCharge({ rate: null, menuItemCost: 55, fallback: 60 })
    ).toBe(55)
    expect(
      resolveGuestMealCharge({ rate: null, menuItemCost: null, fallback: 60 })
    ).toBe(60)
  })

  it("ignores a zero rate rather than charging nothing", () => {
    expect(
      resolveGuestMealCharge({ rate: 0, menuItemCost: 55, fallback: 60 })
    ).toBe(55)
  })
})

describe("resolveScheduledMealPrice", () => {
  it("charges the night's flat price, whatever the guest picks", () => {
    // A roti night costs the same with chicken, with egg or with veg.
    expect(resolveScheduledMealPrice([{ costPerUnit: 65 }])).toBe(65)
  })

  it("lets the dearest dish set the night, so a cheap side cannot undercut it", () => {
    expect(
      resolveScheduledMealPrice([{ costPerUnit: 65 }, { costPerUnit: 10 }])
    ).toBe(65)
  })

  it("says nothing when the menu cannot price the night", () => {
    // Falls through to the rate table, then the configured default.
    expect(resolveScheduledMealPrice([])).toBeNull()
    expect(resolveScheduledMealPrice([{ costPerUnit: 0 }])).toBeNull()
  })
})

describe("guestChoicesFor", () => {
  it("always offers veg, then every tier on offer", () => {
    expect(guestChoicesFor(["CHICKEN", "EGG", "NONE"])).toEqual([
      { type: "VEG", nonVegType: "NONE" },
      { type: "NON_VEG", nonVegType: "CHICKEN" },
      { type: "NON_VEG", nonVegType: "EGG" },
    ])
  })

  it("leaves veg as the only choice on a veg-only slot", () => {
    expect(guestChoicesFor(["NONE"])).toEqual([
      { type: "VEG", nonVegType: "NONE" },
    ])
  })
})

describe("buildGuestMealPricing", () => {
  const ALLOWED = ["CHICKEN", "EGG", "NONE"] as const

  it("quotes the rate the booking will actually be charged", () => {
    // The regression: the form quoted the menu's 65 while the rate table
    // billed 90 for chicken and 45 for veg.
    const { prices } = buildGuestMealPricing({
      allowed: [...ALLOWED],
      rates: { "NON_VEG:CHICKEN": 90, "VEG:NONE": 45 },
      menuItemCost: 65,
      fallback: 60,
    })

    expect(
      prices[guestChoiceKey({ type: "NON_VEG", nonVegType: "CHICKEN" })]
    ).toBe(90)
    expect(prices[guestChoiceKey({ type: "VEG", nonVegType: "NONE" })]).toBe(45)
    // No egg row, so the night's menu price stands.
    expect(prices[guestChoiceKey({ type: "NON_VEG", nonVegType: "EGG" })]).toBe(
      65
    )
  })

  it("prices lunch and dinner apart when their rates differ", () => {
    const rated = (amount: number) =>
      buildGuestMealPricing({
        allowed: ["NONE"],
        rates: { "VEG:NONE": amount },
        menuItemCost: 65,
        fallback: 60,
      }).prices["VEG:NONE"]

    // Same weekday menu, different slot rates - the form showed 65 for both.
    expect(rated(40)).toBe(40)
    expect(rated(75)).toBe(75)
  })

  it("always names a price, so no booking is quoted blank", () => {
    const { prices, flat } = buildGuestMealPricing({
      allowed: [...ALLOWED],
      rates: {},
      menuItemCost: null,
      fallback: 60,
    })

    expect(Object.values(prices)).toEqual([60, 60, 60])
    expect(flat).toBe(true)
  })

  it("reports a slot as flat only when every choice really costs the same", () => {
    expect(
      buildGuestMealPricing({
        allowed: [...ALLOWED],
        rates: {},
        menuItemCost: 65,
        fallback: 60,
      }).flat
    ).toBe(true)

    expect(
      buildGuestMealPricing({
        allowed: [...ALLOWED],
        rates: { "NON_VEG:CHICKEN": 90 },
        menuItemCost: 65,
        fallback: 60,
      }).flat
    ).toBe(false)
  })

  it("prices only bookable choices, never non-veg without a tier", () => {
    // The form quoted `NON_VEG:NONE` the moment you switched to Non-Veg but
    // had not picked a tier yet. It is not a bookable choice - the schema
    // rejects it - so it has no price, and the quote used to vanish.
    const { prices } = buildGuestMealPricing({
      allowed: [...ALLOWED],
      rates: {},
      menuItemCost: 65,
      fallback: 60,
    })

    expect(prices).not.toHaveProperty("NON_VEG:NONE")
    expect(Object.keys(prices)).toEqual([
      "VEG:NONE",
      "NON_VEG:CHICKEN",
      "NON_VEG:EGG",
    ])
  })

  it("leaves a veg-only slot with nothing non-veg to book", () => {
    // Friday lunch: one dish that offers no tier. Booking non-veg there is a
    // dead end, so the form has to steer away from it rather than price it.
    const { prices } = buildGuestMealPricing({
      allowed: ["NONE"],
      rates: {},
      menuItemCost: 45,
      fallback: 60,
    })

    expect(Object.keys(prices)).toEqual(["VEG:NONE"])
    expect(prices["VEG:NONE"]).toBe(45)
  })

  it("ignores a zero rate rather than quoting a free meal", () => {
    const { prices } = buildGuestMealPricing({
      allowed: ["NONE"],
      rates: { "VEG:NONE": 0 },
      menuItemCost: 65,
      fallback: 60,
    })
    expect(prices["VEG:NONE"]).toBe(65)
  })
})
