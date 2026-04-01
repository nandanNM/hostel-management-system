"use server"

import { ApiResponse } from "@/types"

import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"
import { GuestMeal, guestMealSchema } from "@/lib/validations"

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
