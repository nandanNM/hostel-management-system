"use server"

import { revalidatePath } from "next/cache"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { ApiResponse } from "@/types"
import { z } from "zod"

import { MealTimeType, MealType, NonVegType } from "@/lib/generated/prisma"
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
  amount: number
}

export async function getMessConfigForEditing(): Promise<{
  config: MessConfigValues
  rates: GuestMealRateRow[]
}> {
  await requireMessPrefect()

  const [config, rates] = await Promise.all([
    getMessConfig(),
    prisma.guestMealRate.findMany({
      select: { mealTime: true, type: true, nonVegType: true, amount: true },
      orderBy: [{ mealTime: "asc" }, { nonVegType: "asc" }],
    }),
  ])

  return { config, rates }
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
    await requireMessPrefect()

    if (!Number.isFinite(row.amount) || row.amount < 0) {
      return { status: "error", message: "Enter a valid amount." }
    }

    await prisma.guestMealRate.upsert({
      where: {
        mealTime_type_nonVegType: {
          mealTime: row.mealTime,
          type: row.type,
          nonVegType: row.nonVegType,
        },
      },
      create: row,
      update: { amount: row.amount },
    })

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
