import { describe, expect, it } from "vitest"

import type { NonVegType } from "@/lib/generated/prisma"
import {
  applyAlumniDiscount,
  buildGuestMealPricing,
  checkBookingWindow,
  checkGuestsPerBooking,
  checkMonthlyGuestQuota,
  guestChoiceKey,
  guestChoicesFor,
  istMinuteOfDay,
  resolveGuestMealCharge,
  resolveScheduledMealPrice,
  resolveTierPrices,
  type PricedDish,
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

  it("takes today's lunch while no count has been generated", () => {
    // The regression: lunch was refused for the whole of today on the theory
    // that the count is always generated in the morning. On a day nobody
    // generated one - which is most days on this hostel's dev data - that
    // closed a slot the kitchen could still have cooked for.
    const today = new Date("2026-08-01T06:00:00.000Z")
    const dawn = new Date("2026-07-31T22:30:00.000Z") // 04:00 IST

    expect(checkBookingWindow(today, "LUNCH", CONFIG, dawn).ok).toBe(true)
    expect(checkBookingWindow(today, "LUNCH", CONFIG, MORNING).ok).toBe(true)
  })

  it("refuses a slot whose count has already gone to the kitchen", () => {
    const today = new Date("2026-08-01T06:00:00.000Z")
    const dawn = new Date("2026-07-31T22:30:00.000Z") // 04:00 IST

    // Closed however early it is - the number is out, not the clock's doing.
    for (const slot of ["LUNCH", "DINNER"] as const) {
      const result = checkBookingWindow(today, slot, CONFIG, dawn, true)
      expect(result.ok).toBe(false)
      expect(result.ok === false && result.reason).toMatch(
        /already gone to the kitchen/
      )
      expect(result.ok === false && result.reason).toContain(slot.toLowerCase())
    }
  })

  it("closes each slot at its own cutoff", () => {
    // Lunch starts 12:30 IST, dinner 20:30, cutoff 120 min -> 10:30 and 18:30.
    const today = new Date("2026-08-01T06:00:00.000Z")
    const at1029 = new Date("2026-08-01T04:59:00.000Z") // 10:29 IST
    const at1031 = new Date("2026-08-01T05:01:00.000Z") // 10:31 IST
    const at1800 = new Date("2026-08-01T12:30:00.000Z") // 18:00 IST
    const at1831 = new Date("2026-08-01T13:01:00.000Z") // 18:31 IST

    expect(checkBookingWindow(today, "LUNCH", CONFIG, at1029).ok).toBe(true)
    const lateLunch = checkBookingWindow(today, "LUNCH", CONFIG, at1031)
    expect(lateLunch.ok).toBe(false)
    expect(lateLunch.ok === false && lateLunch.reason).toContain("10:30 AM")

    // Dinner is still open at a time lunch has long closed.
    expect(checkBookingWindow(today, "DINNER", CONFIG, at1800).ok).toBe(true)
    const lateDinner = checkBookingWindow(today, "DINNER", CONFIG, at1831)
    expect(lateDinner.ok).toBe(false)
    expect(lateDinner.ok === false && lateDinner.reason).toContain("6:30 PM")
  })

  it("does not let a generated count reach into another day", () => {
    // Tomorrow's booking is unaffected by today's count, and a past date is
    // still reported as past rather than as a closed count.
    const tomorrow = new Date("2026-08-02T06:00:00.000Z")
    const yesterday = new Date("2026-07-31T06:00:00.000Z")

    expect(
      checkBookingWindow(tomorrow, "LUNCH", CONFIG, MORNING, false).ok
    ).toBe(true)
    const past = checkBookingWindow(yesterday, "LUNCH", CONFIG, MORNING, true)
    expect(past.ok === false && past.reason).toMatch(/already passed/)
  })

  it("leaves tomorrow's lunch bookable", () => {
    const tomorrow = new Date("2026-08-02T06:00:00.000Z")
    const at1800 = new Date("2026-08-01T12:30:00.000Z")
    expect(checkBookingWindow(tomorrow, "LUNCH", CONFIG, at1800).ok).toBe(true)
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

  it("reports the horizon, not the kitchen, for a far-off lunch", () => {
    // A date out of range entirely must say so, whatever the count says.
    const far = new Date("2026-08-20T06:00:00.000Z")
    const result = checkBookingWindow(far, "LUNCH", CONFIG, MORNING, true)
    expect(result.ok === false && result.reason).toMatch(/up to 7 day/)
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
      resolveGuestMealCharge({
        rate: 70,
        tierPrice: 50,
        menuItemCost: 55,
        fallback: 60,
      })
    ).toBe(70)
  })

  it("then what a plate of that tier costs, and only then the night", () => {
    expect(
      resolveGuestMealCharge({
        rate: null,
        tierPrice: 50,
        menuItemCost: 55,
        fallback: 60,
      })
    ).toBe(50)
    expect(
      resolveGuestMealCharge({ rate: null, menuItemCost: 55, fallback: 60 })
    ).toBe(55)
    expect(
      resolveGuestMealCharge({ rate: null, menuItemCost: null, fallback: 60 })
    ).toBe(60)
  })

  it("ignores a zero rate or tier price rather than charging nothing", () => {
    expect(
      resolveGuestMealCharge({ rate: 0, tierPrice: 0, fallback: 60 })
    ).toBe(60)
    expect(
      resolveGuestMealCharge({ rate: 0, menuItemCost: 55, fallback: 60 })
    ).toBe(55)
  })
})

describe("applyAlumniDiscount", () => {
  it("takes the discount off one meal", () => {
    expect(applyAlumniDiscount(45, 5)).toBe(40)
    expect(applyAlumniDiscount(130, 6)).toBe(124)
  })

  it("leaves the price alone when the discount is off", () => {
    expect(applyAlumniDiscount(45, 0)).toBe(45)
  })

  it("never turns a meal into a credit", () => {
    // A discount larger than the meal must floor at free, not go negative -
    // the charge is summed into the boarder's bill.
    expect(applyAlumniDiscount(4, 5)).toBe(0)
    expect(applyAlumniDiscount(45, 500)).toBe(0)
  })

  it("is what both the quote and the charge run through", () => {
    // The form applies it to the price map it was quoted from and the server
    // applies it to the same figure, so agreement is by construction.
    const listPrice = buildGuestMealPricing({
      allowed: ["EGG", "NONE"],
      rates: {},
      tierPrices: { "VEG:NONE": 45, "NON_VEG:EGG": 50 },
      menuItemCost: 50,
      fallback: 60,
    }).prices["VEG:NONE"]

    expect(applyAlumniDiscount(listPrice ?? 0, 5)).toBe(40)
  })
})

describe("resolveTierPrices", () => {
  // The prefect's library, exactly as the standard seed leaves it.
  const LIBRARY: PricedDish[] = [
    { costPerUnit: 130, offers: ["MUTTON", "CHICKEN", "FISH", "EGG"] },
    { costPerUnit: 60, offers: ["CHICKEN", "FISH", "EGG"] }, // Chicken
    { costPerUnit: 60, offers: ["CHICKEN", "EGG"] }, // Roti
    { costPerUnit: 55, offers: ["FISH", "EGG"] }, // Fish
    { costPerUnit: 50, offers: ["EGG"] }, // Egg
    { costPerUnit: 45, offers: [] }, // Veg
  ]

  it("reads the library as a tier rate card, by offer and never by name", () => {
    expect(resolveTierPrices(LIBRARY)).toEqual({
      "NON_VEG:MUTTON": 130,
      "NON_VEG:CHICKEN": 60,
      "NON_VEG:FISH": 55,
      "NON_VEG:EGG": 50,
      "VEG:NONE": 45,
    })
  })

  it("prices a dish by the richest thing it offers", () => {
    // Roti offers chicken and egg, so it speaks for chicken - not for egg,
    // which is why a roti night bills egg at the egg plate's price.
    expect(
      resolveTierPrices([{ costPerUnit: 60, offers: ["CHICKEN", "EGG"] }])
    ).toEqual({ "NON_VEG:CHICKEN": 60 })
  })

  it("treats a dish that offers nothing as the veg plate", () => {
    expect(resolveTierPrices([{ costPerUnit: 45, offers: [] }])).toEqual({
      "VEG:NONE": 45,
    })
  })

  it("lets the cheaper of two dishes set their shared tier", () => {
    // A dish added at 55 alongside Roti lowers chicken to 55; one added at 200
    // must not raise it. The prefect needs no code change either way.
    const cheaper = resolveTierPrices([
      ...LIBRARY,
      { costPerUnit: 55, offers: ["CHICKEN", "EGG"] },
    ])
    expect(cheaper["NON_VEG:CHICKEN"]).toBe(55)

    const dearer = resolveTierPrices([
      ...LIBRARY,
      { costPerUnit: 200, offers: ["CHICKEN", "EGG"] },
    ])
    expect(dearer["NON_VEG:CHICKEN"]).toBe(60)
  })

  it("follows the prefect's priority order when it is reordered", () => {
    // Fish promoted above chicken: a dish offering both now speaks for fish.
    expect(
      resolveTierPrices(
        [{ costPerUnit: 60, offers: ["CHICKEN", "FISH"] }],
        ["FISH", "CHICKEN", "EGG", "NONE"]
      )
    ).toEqual({ "NON_VEG:FISH": 60 })
  })

  it("ignores an unpriced dish, which says nothing about its tier", () => {
    expect(
      resolveTierPrices([
        { costPerUnit: 0, offers: ["EGG"] },
        { costPerUnit: 50, offers: ["EGG"] },
      ])
    ).toEqual({ "NON_VEG:EGG": 50 })
    expect(resolveTierPrices([])).toEqual({})
  })
})

describe("resolveScheduledMealPrice", () => {
  it("reads the night's dearest dish, so a cheap side cannot undercut it", () => {
    expect(resolveScheduledMealPrice([{ costPerUnit: 65 }])).toBe(65)
    expect(
      resolveScheduledMealPrice([{ costPerUnit: 65 }, { costPerUnit: 10 }])
    ).toBe(65)
  })

  it("says nothing when the menu cannot price the night", () => {
    // Falls through to the configured default.
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

  // The standard library's rate card, which is what a real quote prices from.
  const TIERS = {
    "NON_VEG:MUTTON": 130,
    "NON_VEG:CHICKEN": 60,
    "NON_VEG:FISH": 55,
    "NON_VEG:EGG": 50,
    "VEG:NONE": 45,
  }

  it("charges each choice at its own tier, not at the night's price", () => {
    // The bug: Tuesday dinner is an Egg night, so veg was quoted the egg's
    // 50 - the guest paid for food nobody cooked for them.
    const { prices } = buildGuestMealPricing({
      allowed: ["EGG", "NONE"],
      rates: {},
      tierPrices: TIERS,
      menuItemCost: 50,
      fallback: 60,
    })

    expect(prices["VEG:NONE"]).toBe(45)
    expect(prices["NON_VEG:EGG"]).toBe(50)
  })

  it("prices a roti night by what the guest gets, not by the roti", () => {
    // Friday dinner: Roti at 60, offering chicken and egg. Chicken costs the
    // chicken rate and egg the egg rate, and the roti's own 60 never applies.
    const { prices } = buildGuestMealPricing({
      allowed: ["CHICKEN", "EGG", "NONE"],
      rates: {},
      tierPrices: TIERS,
      menuItemCost: 60,
      fallback: 60,
    })

    expect(prices).toEqual({
      "VEG:NONE": 45,
      "NON_VEG:CHICKEN": 60,
      "NON_VEG:EGG": 50,
    })
  })

  it("quotes veg the same on every night, however rich the menu", () => {
    const vegOn = (menuItemCost: number, allowed: NonVegType[]) =>
      buildGuestMealPricing({
        allowed,
        rates: {},
        tierPrices: TIERS,
        menuItemCost,
        fallback: 60,
      }).prices["VEG:NONE"]

    expect(vegOn(50, ["EGG", "NONE"])).toBe(45) // egg night
    expect(vegOn(55, ["FISH", "EGG", "NONE"])).toBe(45) // fish night
    expect(vegOn(130, ["MUTTON", "EGG", "NONE"])).toBe(45) // mutton night
  })

  it("quotes the rate the booking will actually be charged", () => {
    // The regression: the form quoted the menu's 65 while the rate table
    // billed 90 for chicken and 45 for veg.
    const { prices } = buildGuestMealPricing({
      allowed: [...ALLOWED],
      rates: { "NON_VEG:CHICKEN": 90, "VEG:NONE": 45 },
      tierPrices: TIERS,
      menuItemCost: 65,
      fallback: 60,
    })

    expect(
      prices[guestChoiceKey({ type: "NON_VEG", nonVegType: "CHICKEN" })]
    ).toBe(90)
    expect(prices[guestChoiceKey({ type: "VEG", nonVegType: "NONE" })]).toBe(45)
    // No egg row, so the egg tier's own price stands.
    expect(prices[guestChoiceKey({ type: "NON_VEG", nonVegType: "EGG" })]).toBe(
      50
    )
  })

  it("prices lunch and dinner apart when their rates differ", () => {
    const rated = (amount: number) =>
      buildGuestMealPricing({
        allowed: ["NONE"],
        rates: { "VEG:NONE": amount },
        tierPrices: TIERS,
        menuItemCost: 65,
        fallback: 60,
      }).prices["VEG:NONE"]

    // Same weekday menu, different slot rates - the form showed 65 for both.
    expect(rated(40)).toBe(40)
    expect(rated(75)).toBe(75)
  })

  it("falls back to the night for a tier the library cannot price", () => {
    // A library of nothing but Roti prices chicken but never egg, so an egg
    // booking on a roti night has only the night's figure to go on.
    const { prices } = buildGuestMealPricing({
      allowed: [...ALLOWED],
      rates: {},
      tierPrices: { "NON_VEG:CHICKEN": 60 },
      menuItemCost: 65,
      fallback: 60,
    })

    expect(prices["NON_VEG:CHICKEN"]).toBe(60)
    expect(prices["NON_VEG:EGG"]).toBe(65)
    expect(prices["VEG:NONE"]).toBe(65)
  })

  it("always names a price, so no booking is quoted blank", () => {
    const { prices, flat } = buildGuestMealPricing({
      allowed: [...ALLOWED],
      rates: {},
      tierPrices: {},
      menuItemCost: null,
      fallback: 60,
    })

    expect(Object.values(prices)).toEqual([60, 60, 60])
    expect(flat).toBe(true)
  })

  it("reports a slot as flat only when every choice really costs the same", () => {
    // Tier pricing makes most slots anything but flat.
    expect(
      buildGuestMealPricing({
        allowed: [...ALLOWED],
        rates: {},
        tierPrices: TIERS,
        menuItemCost: 65,
        fallback: 60,
      }).flat
    ).toBe(false)

    expect(
      buildGuestMealPricing({
        allowed: [...ALLOWED],
        rates: {},
        tierPrices: {},
        menuItemCost: 65,
        fallback: 60,
      }).flat
    ).toBe(true)
  })

  it("prices only bookable choices, never non-veg without a tier", () => {
    // The form quoted `NON_VEG:NONE` the moment you switched to Non-Veg but
    // had not picked a tier yet. It is not a bookable choice - the schema
    // rejects it - so it has no price, and the quote used to vanish.
    const { prices } = buildGuestMealPricing({
      allowed: [...ALLOWED],
      rates: {},
      tierPrices: TIERS,
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
      tierPrices: TIERS,
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
      tierPrices: TIERS,
      menuItemCost: 65,
      fallback: 60,
    })
    expect(prices["VEG:NONE"]).toBe(45)
  })
})
