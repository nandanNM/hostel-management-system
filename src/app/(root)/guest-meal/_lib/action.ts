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
    if (!session?.user.id || !session?.user.hostelId) {
      return {
        status: "error",
        message: "Unauthorized",
      }
    }
    const name =
      values.type === "VEG"
        ? "Veg"
        : values.nonVegType
          ? values.nonVegType.charAt(0).toUpperCase() +
            values.nonVegType.slice(1).toLowerCase()
          : ""

    const charge = await prisma.menuItem.findFirst({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
      select: {
        costPerUnit: true,
      },
    })

    const meal = await prisma.guestMeal.create({
      data: {
        ...values,
        nonVegType: values.nonVegType ?? "NONE",
        userId: session.user.id,
        hostelId: session.user.hostelId,
        mealCharge: charge?.costPerUnit || 50,
      },
    })
    prisma.activityLog
      .create({
        data: {
          userId: session.user.id,
          hostelId: session.user.hostelId,
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
