import { differenceInCalendarDays } from "date-fns"

import { istWallClock, istYmd } from "@/lib/date"
import { MealTimeType, MealType, NonVegType } from "@/lib/generated/prisma"

export type BookingWindowConfig = {
  guestBookingMaxDaysAhead: number
  guestBookingCutoffMinutes: number
  lunchStartMinute: number
  dinnerStartMinute: number
}

export type RuleResult = { ok: true } | { ok: false; reason: string }

/** Minutes after midnight IST for the given instant. */
export function istMinuteOfDay(at: Date): number {
  const wall = istWallClock(at)
  return wall.getHours() * 60 + wall.getMinutes()
}

function formatMinute(minute: number): string {
  const h24 = Math.floor(minute / 60) % 24
  const mm = String(minute % 60).padStart(2, "0")
  const suffix = h24 < 12 ? "AM" : "PM"
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${mm} ${suffix}`
}

/**
 * Whether a guest meal may still be booked for the given India day and slot.
 *
 * Rejects days in the past, days beyond the booking horizon, and same-day
 * bookings placed after the cutoff — the kitchen has already bought for that
 * meal by then.
 */
export function checkBookingWindow(
  bookedFor: Date,
  mealTime: MealTimeType,
  config: BookingWindowConfig,
  now: Date = new Date()
): RuleResult {
  const daysAhead = differenceInCalendarDays(
    new Date(`${istYmd(bookedFor)}T00:00:00.000Z`),
    new Date(`${istYmd(now)}T00:00:00.000Z`)
  )

  if (daysAhead < 0) {
    return { ok: false, reason: "That date has already passed." }
  }

  if (daysAhead > config.guestBookingMaxDaysAhead) {
    return {
      ok: false,
      reason: `Guest meals can only be booked up to ${config.guestBookingMaxDaysAhead} day(s) ahead.`,
    }
  }

  if (daysAhead === 0) {
    const slotStart =
      mealTime === MealTimeType.LUNCH
        ? config.lunchStartMinute
        : config.dinnerStartMinute
    const closesAt = slotStart - config.guestBookingCutoffMinutes

    if (istMinuteOfDay(now) > closesAt) {
      return {
        ok: false,
        reason: `Bookings for today's ${mealTime.toLowerCase()} closed at ${formatMinute(closesAt)}.`,
      }
    }
  }

  return { ok: true }
}

/** Per-booking guest cap. 0 disables the cap. */
export function checkGuestsPerBooking(
  numberOfMeals: number,
  maxGuestsPerBooking: number
): RuleResult {
  if (maxGuestsPerBooking > 0 && numberOfMeals > maxGuestsPerBooking) {
    return {
      ok: false,
      reason: `You can book at most ${maxGuestsPerBooking} guest meal(s) at a time.`,
    }
  }
  return { ok: true }
}

/** Per-boarder monthly cap, counting meals already booked. 0 disables it. */
export function checkMonthlyGuestQuota(
  alreadyBookedThisMonth: number,
  requested: number,
  maxPerMonth: number
): RuleResult {
  if (maxPerMonth <= 0) return { ok: true }

  const remaining = maxPerMonth - alreadyBookedThisMonth
  if (requested > remaining) {
    return {
      ok: false,
      reason:
        remaining <= 0
          ? `You have used your ${maxPerMonth} guest meals for this month.`
          : `That exceeds your monthly limit - you have ${remaining} guest meal(s) left of ${maxPerMonth}.`,
    }
  }
  return { ok: true }
}

/**
 * The flat price the scheduled menu sets for one guest meal that night.
 *
 * A guest pays for the *day*, not for the tier they picked: a roti night
 * costs the same with chicken, with egg or with veg. Where a slot lists
 * several dishes the dearest sets the price, so adding a cheap side can never
 * undercut the night.
 *
 * This replaces looking the dish up by *name* ("Veg"/"Chicken"/"Egg"...),
 * which could never match a dish called Roti and so charged a roti night at
 * the plain tier rate.
 */
export function resolveScheduledMealPrice(
  dishes: { costPerUnit: number }[]
): number | null {
  const priced = dishes.map((d) => d.costPerUnit).filter((c) => c > 0)
  return priced.length > 0 ? Math.max(...priced) : null
}

/**
 * Price for one guest meal: the prefect's rate table first, then what the
 * scheduled menu sets, then the configured fallback.
 */
export function resolveGuestMealCharge(args: {
  rate?: number | null
  menuItemCost?: number | null
  fallback: number
}): number {
  if (args.rate != null && args.rate > 0) return args.rate
  if (args.menuItemCost != null && args.menuItemCost > 0)
    return args.menuItemCost
  return args.fallback
}

export type RateKey = {
  mealTime: MealTimeType
  type: MealType
  nonVegType: NonVegType
}

export function rateKey({ mealTime, type, nonVegType }: RateKey): string {
  return `${mealTime}:${type}:${nonVegType}`
}
