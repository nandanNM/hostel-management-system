import { differenceInCalendarDays } from "date-fns"

import { istWallClock, istYmd } from "@/lib/date"
import { MealTimeType, MealType, NonVegType } from "@/lib/generated/prisma"
import { NON_VEG_PRIORITY } from "@/lib/meal-priority"

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
 * Rejects days in the past, days beyond the booking horizon, slots whose count
 * has already been generated, and same-day bookings placed after the cutoff.
 *
 * `countGenerated` is the authority on whether the kitchen has the number yet —
 * see `getGeneratedSlots`. This used to be assumed rather than read: today's
 * lunch was refused outright on the grounds that the count is generated in the
 * morning, which closed lunch bookings on every day nobody generated one.
 */
export function checkBookingWindow(
  bookedFor: Date,
  mealTime: MealTimeType,
  config: BookingWindowConfig,
  now: Date = new Date(),
  countGenerated = false
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

  // The count is out, so the kitchen is cooking to a number this booking is
  // not in. That closes the slot however early it still is.
  if (countGenerated) {
    return {
      ok: false,
      reason: `The ${mealTime.toLowerCase()} count has already gone to the kitchen, so nothing more can be added to it.`,
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
 * The last resort before the configured fallback: it now only prices a tier
 * that the dish library cannot price on its own — see `resolveTierPrices`,
 * which is what makes a guest pay for the tier they booked rather than for
 * whatever the night's dearest dish happened to cost. Where a slot lists
 * several dishes the dearest sets this figure, so a cheap side cannot
 * undercut the night.
 *
 * Never looks a dish up by *name* ("Veg"/"Chicken"/"Egg"...), which could
 * not match a dish called Roti.
 */
export function resolveScheduledMealPrice(
  dishes: { costPerUnit: number }[]
): number | null {
  const priced = dishes.map((d) => d.costPerUnit).filter((c) => c > 0)
  return priced.length > 0 ? Math.max(...priced) : null
}

/**
 * Price for one guest meal: the prefect's rate table first, then what a plate
 * of that tier costs in the dish library, then what the scheduled menu sets,
 * then the configured fallback.
 */
export function resolveGuestMealCharge(args: {
  rate?: number | null
  tierPrice?: number | null
  menuItemCost?: number | null
  fallback: number
}): number {
  if (args.rate != null && args.rate > 0) return args.rate
  if (args.tierPrice != null && args.tierPrice > 0) return args.tierPrice
  if (args.menuItemCost != null && args.menuItemCost > 0)
    return args.menuItemCost
  return args.fallback
}

/**
 * One bookable choice, keyed exactly like the rate table's unique index so a
 * quote and a charge can never disagree about which row applies.
 */
export type GuestChoice = { type: MealType; nonVegType: NonVegType }

export function guestChoiceKey({ type, nonVegType }: GuestChoice): string {
  return `${type}:${nonVegType}`
}

/** Veg, plus every tier the slot actually offers. */
export function guestChoicesFor(allowed: NonVegType[]): GuestChoice[] {
  return [
    { type: MealType.VEG, nonVegType: NonVegType.NONE },
    ...allowed
      .filter((tier) => tier !== NonVegType.NONE)
      .map((tier) => ({ type: MealType.NON_VEG, nonVegType: tier })),
  ]
}

export type GuestMealPricing = {
  /** Price per meal for each bookable choice, by `guestChoiceKey`. */
  prices: Record<string, number>
  /** True when every choice in the slot costs the same. */
  flat: boolean
}

/**
 * What one meal costs once the alumni discount is taken off.
 *
 * Applied on top of the price map rather than inside it: the discount belongs
 * to who the guest is, not to what the kitchen is cooking, and the same figure
 * has to come out on the form and on the bill. Never goes below zero - a
 * discount larger than the meal must not turn into a credit.
 */
export function applyAlumniDiscount(price: number, discount: number): number {
  if (!(discount > 0)) return price
  return Math.max(0, price - discount)
}

/** A library dish, as far as pricing cares: what it costs and what it serves. */
export type PricedDish = { costPerUnit: number; offers: NonVegType[] }

/**
 * What one plate of each tier costs, read off the prefect's dish library.
 *
 * A dish's *headline* tier is the richest thing it offers, so the library
 * doubles as a tier rate card - Chicken ₹60, Fish ₹55, Egg ₹50 - and a dish
 * that offers nothing is a veg plate. A guest then pays for the tier they
 * booked and not for whatever the night happened to cost: veg on a fish night
 * was billed the fish price, and egg on a roti night the roti price.
 *
 * Nothing here reads a dish name, so a dish the prefect adds next term prices
 * itself. Roti, which offers chicken and egg, prices chicken without ever
 * being "the chicken dish" - and where two dishes share a headline tier the
 * cheaper one sets the rate, so one expensive dish cannot quietly raise a
 * tier for every night that serves it.
 */
export function resolveTierPrices(
  dishes: PricedDish[],
  priority: NonVegType[] = NON_VEG_PRIORITY
): Record<string, number> {
  const chain = (priority.length > 0 ? priority : NON_VEG_PRIORITY).filter(
    (tier) => tier !== NonVegType.NONE
  )
  const prices: Record<string, number> = {}

  for (const dish of dishes) {
    // A dish with no price set says nothing about what its tier costs.
    if (!(dish.costPerUnit > 0)) continue

    const headline = chain.find((tier) => dish.offers.includes(tier))
    const key = guestChoiceKey(
      headline
        ? { type: MealType.NON_VEG, nonVegType: headline }
        : { type: MealType.VEG, nonVegType: NonVegType.NONE }
    )

    const set = prices[key]
    if (set === undefined || dish.costPerUnit < set) {
      prices[key] = dish.costPerUnit
    }
  }

  return prices
}

/**
 * What every choice in one slot costs.
 *
 * The booking form used to quote `resolveScheduledMealPrice` on its own while
 * the charge went through the rate table, so the moment the prefect set any
 * rate the number on screen stopped being the number billed. And because the
 * rate table is keyed by meal time as well as tier, lunch and dinner were
 * quoted the same menu figure while being charged apart. Both sides read this
 * now, so the quote is the charge by construction.
 *
 * The night's own price only prices a tier the library cannot, which is why
 * `tierPrices` is not optional: a caller that forgot it would silently go
 * back to billing every choice at the night's rate.
 */
export function buildGuestMealPricing(args: {
  allowed: NonVegType[]
  rates: Record<string, number>
  tierPrices: Record<string, number>
  menuItemCost: number | null
  fallback: number
}): GuestMealPricing {
  const prices: Record<string, number> = {}

  for (const choice of guestChoicesFor(args.allowed)) {
    const key = guestChoiceKey(choice)
    prices[key] = resolveGuestMealCharge({
      rate: args.rates[key],
      tierPrice: args.tierPrices[key],
      menuItemCost: args.menuItemCost,
      fallback: args.fallback,
    })
  }

  return { prices, flat: new Set(Object.values(prices)).size <= 1 }
}
