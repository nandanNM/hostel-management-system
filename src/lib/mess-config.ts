import "server-only"

import { cache } from "react"

import { cached, cacheKeys } from "@/lib/cache"
import { NonVegType } from "@/lib/generated/prisma"
import { NON_VEG_PRIORITY } from "@/lib/meal-priority"
import prisma from "@/lib/prisma"

export const MESS_CONFIG_ID = "singleton"

/**
 * What the app did before any of this was configurable. A missing row must
 * behave exactly like the old hardcoded constants, so an unconfigured mess
 * keeps working.
 */
export const MESS_CONFIG_DEFAULTS = {
  nonVegPriority: NON_VEG_PRIORITY,
  guestBookingMaxDaysAhead: 7,
  guestBookingCutoffMinutes: 120,
  lunchStartMinute: 12 * 60 + 30,
  dinnerStartMinute: 20 * 60 + 30,
  guestMealFallbackCharge: 60,
  maxGuestsPerBooking: 5,
  maxGuestMealsPerUserPerMonth: 20,
  mealPreferenceLockMinutes: 120,
} as const

export type MessConfigValues = {
  -readonly [K in keyof typeof MESS_CONFIG_DEFAULTS]: K extends "nonVegPriority"
    ? NonVegType[]
    : number
}

/**
 * Cached per request, so the many call sites that need one number do not each
 * make their own query.
 */
/** An hour is plenty: every write path invalidates the key explicitly. */
const TTL_SECONDS = 60 * 60

export const getMessConfig = cache(
  async (): Promise<MessConfigValues> =>
    cached(cacheKeys.messConfig(), TTL_SECONDS, readMessConfig)
)

async function readMessConfig(): Promise<MessConfigValues> {
  const row = await prisma.messConfig.findUnique({
    where: { id: MESS_CONFIG_ID },
  })

  if (!row) return { ...MESS_CONFIG_DEFAULTS }

  // An empty priority array would silently disable non-veg entirely.
  const priority =
    row.nonVegPriority.length > 0
      ? row.nonVegPriority
      : [...MESS_CONFIG_DEFAULTS.nonVegPriority]

  return {
    nonVegPriority: priority,
    guestBookingMaxDaysAhead: row.guestBookingMaxDaysAhead,
    guestBookingCutoffMinutes: row.guestBookingCutoffMinutes,
    lunchStartMinute: row.lunchStartMinute,
    dinnerStartMinute: row.dinnerStartMinute,
    guestMealFallbackCharge: row.guestMealFallbackCharge,
    maxGuestsPerBooking: row.maxGuestsPerBooking,
    maxGuestMealsPerUserPerMonth: row.maxGuestMealsPerUserPerMonth,
    mealPreferenceLockMinutes: row.mealPreferenceLockMinutes,
  }
}
