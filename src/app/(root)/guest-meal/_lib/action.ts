"use server"

import { ApiResponse } from "@/types"

import { cached, cacheKeys } from "@/lib/cache"
import {
  formatIST,
  istCalendarDay,
  istEndOfMonth,
  istParts,
  istStartOfMonth,
} from "@/lib/date"
import {
  DayOfWeek,
  GuestMealStatusType,
  MealTimeType,
  NonVegType,
} from "@/lib/generated/prisma"
import {
  buildGuestMealPricing,
  checkBookingWindow,
  checkGuestsPerBooking,
  checkMonthlyGuestQuota,
  guestChoiceKey,
  resolveScheduledMealPrice,
  type GuestMealPricing,
} from "@/lib/guest-meal-rules"
import { getAllowedGuestTypes, resolveOffers } from "@/lib/meal-priority"
import { getMessConfig } from "@/lib/mess-config"
import prisma from "@/lib/prisma"
import {
  checkRateLimit,
  describeRetryAfter,
  guestMealBookingLimiter,
} from "@/lib/ratelimit"
import { requireUser } from "@/lib/require-user"
import { GuestMeal, guestMealSchema } from "@/lib/validations"

const MENU_TTL_SECONDS = 60 * 60
const RATES_TTL_SECONDS = 60 * 60

/**
 * The non-veg options a guest meal may use for a given day and slot, derived
 * from the menu the prefect scheduled for that weekday.
 *
 * The weekday is taken in India time - on a UTC server the picked date would
 * otherwise resolve to the previous day and read the wrong menu.
 */
type ScheduledDish = {
  name: string
  offers: NonVegType[]
  costPerUnit: number
}

/** The weekday the menu is keyed by, read in India time on any server. */
function istDayOfWeek(date: Date): DayOfWeek {
  return formatIST(date, "EEEE").toUpperCase() as DayOfWeek
}

/**
 * The slot's menu, reduced to what booking needs: what each dish can provide
 * and what it costs. Changes only when the prefect edits the menu, which
 * invalidates this key.
 */
async function getScheduledDishes(
  date: Date,
  mealTime: MealTimeType
): Promise<ScheduledDish[]> {
  const dayOfWeek = istDayOfWeek(date)

  const dishes = await cached(
    cacheKeys.mealSchedule(dayOfWeek, mealTime),
    MENU_TTL_SECONDS,
    async () => {
      const entry = await prisma.mealScheduleEntry.findUnique({
        where: { dayOfWeek_mealTime: { dayOfWeek, mealTime } },
        include: {
          menuItems: {
            select: {
              menuItem: {
                select: { name: true, offers: true, costPerUnit: true },
              },
            },
          },
        },
      })
      return entry?.menuItems.map((mi) => mi.menuItem) ?? []
    }
  )

  return dishes ?? []
}

/**
 * The prefect's rate rows for one slot, by `guestChoiceKey`.
 *
 * At most five rows, read on every quote as the guest changes the form, so it
 * is cached and cleared whenever a rate is saved.
 */
async function getSlotRates(
  mealTime: MealTimeType
): Promise<Record<string, number>> {
  const rates = await cached(
    cacheKeys.guestMealRates(mealTime),
    RATES_TTL_SECONDS,
    async () => {
      const rows = await prisma.guestMealRate.findMany({
        where: { mealTime },
        select: { type: true, nonVegType: true, amount: true },
      })
      return Object.fromEntries(
        rows.map((row) => [guestChoiceKey(row), row.amount])
      )
    }
  )

  return rates ?? {}
}

/**
 * What a guest may book for a day and slot, and what each choice costs.
 *
 * The price map is the single pricing authority: `createGuestMeal` bills
 * straight out of it, so whatever the form quotes is what lands on the bill.
 *
 * `menu` is whatever the prefect actually scheduled, by name, so a dish added
 * next term shows up in the booking form on its own - nothing here knows or
 * needs to know that tonight happens to be Roti.
 */
export async function getAllowedGuestMealOptions(
  date: Date,
  mealTime: MealTimeType
): Promise<{
  dayOfWeek: DayOfWeek
  menu: string[]
  offers: NonVegType[]
  allowed: NonVegType[]
  pricing: GuestMealPricing
}> {
  await requireUser()

  const [config, dishes, rates] = await Promise.all([
    getMessConfig(),
    getScheduledDishes(date, mealTime),
    getSlotRates(mealTime),
  ])

  const offers = resolveOffers(dishes, config.nonVegPriority)
  const allowed = getAllowedGuestTypes(offers)

  return {
    dayOfWeek: istDayOfWeek(date),
    menu: dishes.map((dish) => dish.name),
    offers,
    allowed,
    pricing: buildGuestMealPricing({
      allowed,
      rates,
      menuItemCost: resolveScheduledMealPrice(dishes),
      fallback: config.guestMealFallbackCharge,
    }),
  }
}

/** The booking horizon the prefect configured, for the date picker. */
export async function getGuestBookingWindow(): Promise<{
  maxDaysAhead: number
}> {
  await requireUser()
  const { guestBookingMaxDaysAhead } = await getMessConfig()
  return { maxDaysAhead: guestBookingMaxDaysAhead }
}

export const deleteGuestMealRequest = async (
  id: string
): Promise<ApiResponse> => {
  try {
    const session = await requireUser()
    if (!session?.user.id) {
      return {
        status: "error",
        message: "Unauthorized",
      }
    }
    await prisma.guestMeal.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    prisma.activityLog
      .create({
        data: {
          userId: session.user.id,
          actionType: "DELETE",
          entityType: "GUEST_MEAL",
          entityId: id,
          details: "Guest meal request deleted by the requester.",
        },
      })
      .catch((err) => console.error("Activity log creation failed:", err))

    return {
      status: "success",
      message: "Guest meal request deleted successfully",
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    }
  }
}

export async function createGuestMeal(values: GuestMeal): Promise<ApiResponse> {
  const validation = await guestMealSchema.safeParseAsync(values)
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data",
    }
  }
  try {
    const session = await requireUser()
    if (!session?.user.id) {
      return {
        status: "error",
        message: "Unauthorized",
      }
    }
    // Abuse brake before any query runs: a retry loop should cost one Redis
    // command, not a fistful of Postgres round trips.
    const limit = await checkRateLimit(
      guestMealBookingLimiter,
      `guest-meal:${session.user.id}`
    )
    if (!limit.allowed) {
      return {
        status: "error",
        message: `Too many booking attempts. Try again in ${describeRetryAfter(limit.retryAfterSeconds)}.`,
      }
    }

    const config = await getMessConfig()

    // Every rule is enforced here, not only in the form: the UI narrows the
    // choices for convenience, but a crafted request must not get past them.
    const bookingWindow = checkBookingWindow(
      values.date,
      values.mealTime,
      config
    )
    if (!bookingWindow.ok)
      return { status: "error", message: bookingWindow.reason }

    const perBooking = checkGuestsPerBooking(
      values.numberOfMeals,
      config.maxGuestsPerBooking
    )
    if (!perBooking.ok) return { status: "error", message: perBooking.reason }

    if (config.maxGuestMealsPerUserPerMonth > 0) {
      const { year, month } = istParts(values.date)
      const used = await prisma.guestMeal.aggregate({
        _sum: { numberOfMeals: true },
        where: {
          userId: session.user.id,
          date: {
            gte: istStartOfMonth(year, month),
            lte: istEndOfMonth(year, month),
          },
          status: { not: GuestMealStatusType.REJECTED },
        },
      })

      const quota = checkMonthlyGuestQuota(
        used._sum.numberOfMeals ?? 0,
        values.numberOfMeals,
        config.maxGuestMealsPerUserPerMonth
      )
      if (!quota.ok) return { status: "error", message: quota.reason }
    }

    // One read for both the rule check and the price: the form quotes out of
    // this same call, so the guest cannot be shown one figure and billed
    // another.
    const { allowed, pricing } = await getAllowedGuestMealOptions(
      values.date,
      values.mealTime
    )

    // Re-check server-side: the form filters the dropdown, but a crafted
    // request could still ask for an item the kitchen is not cooking.
    if (values.type === "NON_VEG") {
      const requested = values.nonVegType ?? NonVegType.NONE

      if (!allowed.includes(requested)) {
        const bookable = allowed
          .filter((type) => type !== NonVegType.NONE)
          .map((type) => type.toLowerCase())
        return {
          status: "error",
          message:
            bookable.length > 0
              ? `${requested.toLowerCase()} is not being cooked for that meal. It serves ${bookable.join(" and ")}, so you can book ${bookable.join(", ")} or veg.`
              : `That meal is vegetarian only, so you can book veg.`,
        }
      }
    }

    // Exactly the figure the form quoted for this choice. A choice with no
    // entry cannot reach here - the schema rules out NON_VEG without a tier
    // and the check above rules out an unscheduled tier - but an unpriced
    // booking would be worse than a fallback-priced one.
    const chargePerMeal =
      pricing.prices[
        guestChoiceKey({
          type: values.type,
          nonVegType: values.nonVegType ?? NonVegType.NONE,
        })
      ] ?? config.guestMealFallbackCharge

    const meal = await prisma.guestMeal.create({
      data: {
        ...values,
        // The picker hands back the browser's local midnight, which for India
        // serialises to 18:30Z on the *previous* day. Store the India calendar
        // day instead, so the row cannot drift out of its own day's window.
        date: istCalendarDay(values.date),
        nonVegType: values.nonVegType ?? "NONE",
        userId: session.user.id,
        mealCharge: chargePerMeal * values.numberOfMeals,
      },
    })
    prisma.activityLog
      .create({
        data: {
          userId: session.user.id,
          actionType: "CREATE",
          entityType: "GUEST_MEAL",
          entityId: meal.id,
          details: `Guest meal request created for ${values.mealTime.toLowerCase()} on ${values.date.toLocaleDateString()} with ${values.nonVegType === "NONE" ? "vegitarian" : values.nonVegType}.`,
        },
      })
      .catch((err) => {
        console.error("Activity log creation failed:", err)
      })
    return {
      status: "success",
      message: "Guest meal created successfully. 🎉",
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    }
  }
}
