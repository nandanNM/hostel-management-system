"use server"

import { ApiResponse } from "@/types"

import { formatIST, istCalendarDay } from "@/lib/date"
import { DayOfWeek, MealTimeType, NonVegType } from "@/lib/generated/prisma"
import { getAllowedNonVegTypes, resolveOffering } from "@/lib/meal-priority"
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

  const dayOfWeek = formatIST(date, "EEEE").toUpperCase() as DayOfWeek

  const entry = await prisma.mealScheduleEntry.findUnique({
    where: { dayOfWeek_mealTime: { dayOfWeek, mealTime } },
    include: { menuItems: { include: { menuItem: true } } },
  })

  const offering = entry
    ? resolveOffering(entry.menuItems.map((mi) => mi.menuItem.name))
    : null

  return { offering, allowed: getAllowedNonVegTypes(offering) }
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

    const meal = await prisma.guestMeal.create({
      data: {
        ...values,
        // The picker hands back the browser's local midnight, which for India
        // serialises to 18:30Z on the *previous* day. Store the India calendar
        // day instead, so the row cannot drift out of its own day's window.
        date: istCalendarDay(values.date),
        nonVegType: values.nonVegType ?? "NONE",
        userId: session.user.id,
        mealCharge: (MenuItemData?.costPerUnit ?? 60) * values.numberOfMeals,
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
