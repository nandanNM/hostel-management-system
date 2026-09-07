"use server"

import { revalidatePath } from "next/cache"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { ApiResponse } from "@/types"
import { z } from "zod"

import { cacheKeys, guestMealRateKeys, invalidate } from "@/lib/cache"
import { MealTimeType, MealType, NonVegType } from "@/lib/generated/prisma"
import { OFFERABLE_TYPES } from "@/lib/meal-priority"
import {
  getMessConfig,
  MESS_CONFIG_DEFAULTS,
  MESS_CONFIG_ID,
  type MessConfigValues,
} from "@/lib/mess-config"
import prisma from "@/lib/prisma"

const messConfigSchema = z.object({
  nonVegPriority: z
    .array(z.nativeEnum(NonVegType))
    .min(1, "Priority order cannot be empty"),
  guestBookingMaxDaysAhead: z.number().int().min(0).max(60),
  guestBookingCutoffMinutes: z
    .number()
    .int()
    .min(0)
    .max(24 * 60),
  lunchStartMinute: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 - 1),
  dinnerStartMinute: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 - 1),
  guestMealFallbackCharge: z.number().min(0).max(10_000),
  maxGuestsPerBooking: z.number().int().min(0).max(100),
  maxGuestMealsPerUserPerMonth: z.number().int().min(0).max(1_000),
  mealPreferenceLockMinutes: z
    .number()
    .int()
    .min(0)
    .max(24 * 60),
})

export type MessConfigInput = z.infer<typeof messConfigSchema>

export type GuestMealRateRow = {
  mealTime: MealTimeType
  type: MealType
  nonVegType: NonVegType
  /** null means no rate is set, so the menu price applies. */
  amount: number | null
}

/**
 * Every rate the table's unique index allows: both slots, veg plus each tier.
 *
 * The editor used to render only rows that already existed, so an empty table
 * offered nothing to fill in and per-slot pricing could never be entered at
 * all - which is why every meal quoted the one menu price.
 */
const RATE_GRID: Omit<GuestMealRateRow, "amount">[] = [
  MealTimeType.LUNCH,
  MealTimeType.DINNER,
].flatMap((mealTime) => [
  { mealTime, type: MealType.VEG, nonVegType: NonVegType.NONE },
  ...OFFERABLE_TYPES.map((nonVegType) => ({
    mealTime,
    type: MealType.NON_VEG,
    nonVegType,
  })),
])

const gridKey = (row: Omit<GuestMealRateRow, "amount">) =>
  `${row.mealTime}:${row.type}:${row.nonVegType}`

export async function getMessConfigForEditing(): Promise<{
  config: MessConfigValues
  rates: GuestMealRateRow[]
  defaults: Pick<
    MessConfigValues,
    "guestBookingMaxDaysAhead" | "guestBookingCutoffMinutes"
  >
}> {
  await requireMessPrefect()

  const [config, rates] = await Promise.all([
    getMessConfig(),
    prisma.guestMealRate.findMany({
      select: { mealTime: true, type: true, nonVegType: true, amount: true },
      orderBy: [{ mealTime: "asc" }, { nonVegType: "asc" }],
    }),
  ])

  const saved = new Map(rates.map((row) => [gridKey(row), row.amount]))

  return {
    config,
    rates: RATE_GRID.map((row) => ({
      ...row,
      amount: saved.get(gridKey(row)) ?? null,
    })),
    defaults: {
      guestBookingMaxDaysAhead: MESS_CONFIG_DEFAULTS.guestBookingMaxDaysAhead,
      guestBookingCutoffMinutes: MESS_CONFIG_DEFAULTS.guestBookingCutoffMinutes,
    },
  }
}

export async function updateMessConfig(
  input: MessConfigInput
): Promise<ApiResponse> {
  try {
    const session = await requireMessPrefect()

    const parsed = messConfigSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        message: `Invalid settings - ${parsed.error.issues[0]?.message ?? "check the values"}`,
      }
    }

    const values = parsed.data
    const actorId = session.user.id
    if (!actorId) return { status: "error", message: "Unauthorized" }

    // Veg terminates the chain: without it a boarder who dislikes everything
    // resolves to no meal at all.
    const priority = values.nonVegPriority.includes(NonVegType.NONE)
      ? values.nonVegPriority
      : [...values.nonVegPriority, NonVegType.NONE]

    const before = await getMessConfig()

    await prisma.messConfig.upsert({
      where: { id: MESS_CONFIG_ID },
      create: {
        id: MESS_CONFIG_ID,
        ...values,
        nonVegPriority: priority,
        updatedById: actorId,
      },
      update: { ...values, nonVegPriority: priority, updatedById: actorId },
    })

    await prisma.activityLog.create({
      data: {
        userId: actorId,
        actionType: "UPDATE",
        entityType: "MESS_CONFIG",
        entityId: MESS_CONFIG_ID,
        oldData: before,
        newData: { ...values, nonVegPriority: priority },
        details: "Updated mess configuration.",
      },
    })

    // These values gate the booking form and the meal count, so every surface
    // that reads them has to be refreshed.
    await invalidate(cacheKeys.messConfig(), ...guestMealRateKeys())
    revalidatePath("/mess-prefect/settings/mess-config")
    revalidatePath("/guest-meal")
    revalidatePath("/meal-count")

    return { status: "success", message: "Mess settings updated. ✨" }
  } catch (error) {
    console.error("updateMessConfig error:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    }
  }
}

export async function resetMessConfig(): Promise<ApiResponse> {
  try {
    const session = await requireMessPrefect()
    const actorId = session.user.id
    if (!actorId) return { status: "error", message: "Unauthorized" }

    const before = await getMessConfig()

    await prisma.messConfig.upsert({
      where: { id: MESS_CONFIG_ID },
      create: {
        id: MESS_CONFIG_ID,
        ...MESS_CONFIG_DEFAULTS,
        nonVegPriority: [...MESS_CONFIG_DEFAULTS.nonVegPriority],
        updatedById: actorId,
      },
      update: {
        ...MESS_CONFIG_DEFAULTS,
        nonVegPriority: [...MESS_CONFIG_DEFAULTS.nonVegPriority],
        updatedById: actorId,
      },
    })

    prisma.activityLog
      .create({
        data: {
          userId: actorId,
          actionType: "RESET",
          entityType: "MESS_CONFIG",
          entityId: MESS_CONFIG_ID,
          oldData: before,
          newData: MESS_CONFIG_DEFAULTS,
          details: "Reset mess configuration to defaults.",
        },
      })
      .catch((err) => console.error("Activity log creation failed:", err))

    await invalidate(cacheKeys.messConfig())
    revalidatePath("/mess-prefect/settings/mess-config")
    return { status: "success", message: "Restored the default settings." }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    }
  }
}

export async function upsertGuestMealRate(
  row: GuestMealRateRow
): Promise<ApiResponse> {
  try {
    const session = await requireMessPrefect()
    const actorId = session.user.id
    if (!actorId) return { status: "error", message: "Unauthorized" }

    const where = {
      mealTime: row.mealTime,
      type: row.type,
      nonVegType: row.nonVegType,
    }
    const label = `${row.mealTime} ${row.type}${row.nonVegType !== "NONE" ? ` (${row.nonVegType})` : ""}`

    // A blank amount means "no rate": drop the row so the menu price applies
    // again. deleteMany, so clearing an already-blank row is not an error.
    if (row.amount === null) {
      await prisma.guestMealRate.deleteMany({ where })

      prisma.activityLog
        .create({
          data: {
            userId: actorId,
            actionType: "UPDATE",
            entityType: "GUEST_MEAL_RATE",
            entityId: gridKey(row),
            oldData: row,
            details: `Cleared the guest meal rate for ${label}; the menu price applies.`,
          },
        })
        .catch((err) => console.error("Activity log creation failed:", err))

      await invalidate(...guestMealRateKeys())
      revalidatePath("/mess-prefect/settings/mess-config")
      revalidatePath("/guest-meal")
      return {
        status: "success",
        message: "Rate cleared — menu price applies.",
      }
    }

    if (!Number.isFinite(row.amount) || row.amount < 0) {
      return { status: "error", message: "Enter a valid amount." }
    }

    const rate = await prisma.guestMealRate.upsert({
      where: { mealTime_type_nonVegType: where },
      create: { ...where, amount: row.amount },
      update: { amount: row.amount },
    })

    prisma.activityLog
      .create({
        data: {
          userId: actorId,
          actionType: "UPDATE",
          entityType: "GUEST_MEAL_RATE",
          entityId: rate.id,
          newData: row,
          details: `Set guest meal rate for ${label} to ₹${row.amount}.`,
        },
      })
      .catch((err) => console.error("Activity log creation failed:", err))

    await invalidate(...guestMealRateKeys())
    revalidatePath("/mess-prefect/settings/mess-config")
    revalidatePath("/guest-meal")
    return { status: "success", message: "Rate saved." }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    }
  }
}
