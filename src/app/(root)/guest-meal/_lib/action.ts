"use server"

import { ApiResponse } from "@/types"

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
  checkBookingWindow,
  checkGuestsPerBooking,
  checkMonthlyGuestQuota,
  resolveGuestMealCharge,
} from "@/lib/guest-meal-rules"
import { getAllowedNonVegTypes, resolveOffering } from "@/lib/meal-priority"
import { getMessConfig } from "@/lib/mess-config"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"
import { GuestMeal, guestMealSchema } from "@/lib/validations"

/**
 * The non-veg options a guest meal may use for a given day and slot, derived
 * from the menu the prefect scheduled for that weekday.
 *
 * The weekday is taken in India time - on a UTC server the picked date would
 * otherwise resolve to the previous day and read the wrong menu.
 */
export async function getAllowedGuestMealOptions(
  date: Date,
  mealTime: MealTimeType
): Promise<{ offering: NonVegType | null; allowed: NonVegType[] }> {
  await requireUser()

  const { nonVegPriority } = await getMessConfig()
  const dayOfWeek = formatIST(date, "EEEE").toUpperCase() as DayOfWeek

  const entry = await prisma.mealScheduleEntry.findUnique({
    where: { dayOfWeek_mealTime: { dayOfWeek, mealTime } },
    include: { menuItems: { include: { menuItem: true } } },
  })

  const offering = entry
    ? resolveOffering(
        entry.menuItems.map((mi) => mi.menuItem.name),
        nonVegPriority
      )
    : null

  return {
    offering,
    allowed: getAllowedNonVegTypes(offering, nonVegPriority),
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

    // Re-check server-side: the form filters the dropdown, but a crafted
    // request could still ask for an item the kitchen is not cooking.
    if (values.type === "NON_VEG") {
      const { offering, allowed } = await getAllowedGuestMealOptions(
        values.date,
        values.mealTime
      )
      const requested = values.nonVegType ?? NonVegType.NONE

      if (!allowed.includes(requested)) {
        const offeringLabel = offering
          ? offering.toLowerCase()
          : "the scheduled menu"
        return {
          status: "error",
          message: `${requested.toLowerCase()} is not available for that meal. ${offeringLabel} is scheduled, so you can pick ${allowed
            .filter((type) => type !== NonVegType.NONE)
            .map((type) => type.toLowerCase())
            .join(", ")} or veg.`,
        }
      }
    }

    const searchName =
      values.type === "VEG"
        ? "Veg"
        : values.nonVegType
          ? values.nonVegType.charAt(0).toUpperCase() +
            values.nonVegType.slice(1).toLowerCase()
          : ""

    // Try to find exact match first, then fallback to contains
    let MenuItemData = await prisma.menuItem.findFirst({
      where: {
        name: {
          equals: searchName,
          mode: "insensitive",
        },
      },
    })

    if (!MenuItemData) {
      MenuItemData = await prisma.menuItem.findFirst({
        where: {
          name: {
            contains: searchName,
            mode: "insensitive",
          },
        },
      })
    }

    const rate = await prisma.guestMealRate.findUnique({
      where: {
        mealTime_type_nonVegType: {
          mealTime: values.mealTime,
          type: values.type,
          nonVegType: values.nonVegType ?? NonVegType.NONE,
        },
      },
    })

    const chargePerMeal = resolveGuestMealCharge({
      rate: rate?.amount,
      menuItemCost: MenuItemData?.costPerUnit,
      fallback: config.guestMealFallbackCharge,
    })

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
