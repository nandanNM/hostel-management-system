"use server"

import requireManager from "@/data/manager/require-manager"
import { GuestMealStatusType } from "@/generated/prisma"
import { ApiResponse } from "@/types"

import prisma from "@/lib/prisma"

export async function updateGuestMealStatus({
  requestId,
  status,
}: {
  requestId: string
  status: GuestMealStatusType
}): Promise<ApiResponse> {
  console.log(status)
  const session = await requireManager()
  if (!session?.user.hostelId)
    return {
      status: "error",
      message: "Unauthorized - Hostel ID not found",
    }
  try {
    await prisma.guestMeal.update({
      where: {
        id: requestId,
        hostelId: session.user.hostelId,
      },
      data: {
        status: status,
      },
    })

    return {
      status: "success",
      message: "Guest meal status updated successfully",
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
