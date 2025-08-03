"use server"

import requireManager from "@/data/manager/require-manager"
import { ApiResponse } from "@/types"

import {
  BillEntryType,
  GuestMealStatusType,
  NotificationType,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

export async function updateGuestMealStatus({
  requestId,
  status,
  requestedUserId,
  amount,
}: {
  requestId: string
  requestedUserId: string
  amount: number
  status: GuestMealStatusType
}): Promise<ApiResponse> {
  const session = await requireManager()

  if (!session?.user.hostelId) {
    return {
      status: "error",
      message: "Unauthorized - Hostel ID not found",
    }
  }

  try {
    await prisma.guestMeal.update({
      where: {
        id: requestId,
        hostelId: session.user.hostelId,
      },
      data: {
        status: status,
        approvedAt: status === "APPROVED" ? new Date() : null,
        approvedBy: status === "APPROVED" ? session.user.id : null,
      },
    })

    if (status === "APPROVED") {
      await prisma.$transaction(async (tx) => {
        const lastBill = await tx.userBill.findFirst({
          where: { userId: requestedUserId },
          orderBy: { issueDate: "desc" },
        })

        const currentBalance = lastBill?.balanceRemaining ?? 0
        const newBalance = currentBalance + amount

        await tx.userBill.create({
          data: {
            type: BillEntryType.GUEST_MEAL_CHARGE,
            amount,
            description: `Guest Meal: Your meal request was approved by ${session.user.name}.`,
            balanceRemaining: newBalance,
            issueDate: new Date(),
            guestMeal: { connect: { id: requestId } },
            user: { connect: { id: requestedUserId } },
            hostel: { connect: { id: session.user.hostelId as string } },
          },
        })
      })
    }
    prisma.notification
      .create({
        data: {
          title: "Guest Meal Update",
          message: `Your guest meal request was ${status.toLowerCase()} by ${session.user.name}! ${
            status === "APPROVED"
              ? "The guest will be served during the selected meal time."
              : `The guest will not be served during the selected meal time due to the request being ${status.toLowerCase()}.`
          }`,
          type: NotificationType.MEAL,
          hostel: { connect: { id: session.user.hostelId } },
          user: { connect: { id: requestedUserId } },
          issuer: { connect: { id: session.user.id } },
        },
      })
      .catch((err) => {
        console.error("Notification creation failed:", err)
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
