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

    await prisma.guestMeal.create({
      data: {
        ...values,
        nonVegType: values.nonVegType ?? "NONE",
        userId: session.user.id,
        hostelId: session.user.hostelId,
      },
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
