"use server"

import requireManager from "@/data/manager/require-manager"
import { ApiResponse } from "@/types"

import { isManager } from "@/lib/authz"

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

  if (!session) {
    return {
      status: "error",
      message: "Unauthorized",
    }
  }

  // Approving/rejecting guest meals is an operational action reserved for the
  // Manager. MessPrefect has read/oversight access but cannot act on requests.
  if (!isManager(session.user.role)) {
    return {
      status: "error",
      message: "Only a manager can approve or reject guest meals.",
    }
  }

  try {
    await prisma.guestMeal.update({
      where: {
        id: requestId,
      },
      data: {
        status: status,
        approvedAt: status === "APPROVED" ? new Date() : null,
        approvedBy: status === "APPROVED" ? session.user.id : null,
      },
    })

    if (status === "APPROVED") {
      // Charge the user for the approved guest meal, but never double-charge the
      // same request if it had already been approved before.
      await prisma.$transaction(async (tx) => {
        const existingCharge = await tx.userBill.findFirst({
          where: {
            guestMealId: requestId,
            type: BillEntryType.GUEST_MEAL_CHARGE,
          },
        })
        if (existingCharge) return

        const lastBill = await tx.userBill.findFirst({
          where: { userId: requestedUserId },
          orderBy: { createdAt: "desc" },
        })
        const currentDue = lastBill?.balanceRemaining ?? 0

        await tx.userBill.create({
          data: {
            type: BillEntryType.GUEST_MEAL_CHARGE,
            amount,
            description: `Guest Meal: Your meal request was approved by ${session.user.name}.`,
            balanceRemaining: currentDue + amount,
            issueDate: new Date(),
            guestMeal: { connect: { id: requestId } },
            user: { connect: { id: requestedUserId } },
          },
        })
      })
    } else if (status === "REJECTED" || status === "CANCELLED") {
      // If this request was previously approved (and therefore billed), reverse
      // the charge with an adjustment credit so it stops counting toward the
      // user's dues. Idempotent: skip if there is no charge or it was already
      // reversed.
      await prisma.$transaction(async (tx) => {
        const existingCharge = await tx.userBill.findFirst({
          where: {
            guestMealId: requestId,
            type: BillEntryType.GUEST_MEAL_CHARGE,
          },
        })
        if (!existingCharge) return

        const alreadyReversed = await tx.userBill.findFirst({
          where: {
            guestMealId: requestId,
            type: BillEntryType.ADJUSTMENT_CREDIT,
          },
        })
        if (alreadyReversed) return

        const lastBill = await tx.userBill.findFirst({
          where: { userId: requestedUserId },
          orderBy: { createdAt: "desc" },
        })
        const currentDue = lastBill?.balanceRemaining ?? 0
        const chargeAmount = existingCharge.amount

        await tx.userBill.create({
          data: {
            type: BillEntryType.ADJUSTMENT_CREDIT,
            amount: -chargeAmount,
            description: `Guest Meal reversal: request ${status.toLowerCase()} by ${session.user.name}; charge of ₹${chargeAmount.toFixed(
              2
            )} refunded.`,
            balanceRemaining: currentDue - chargeAmount,
            issueDate: new Date(),
            guestMeal: { connect: { id: requestId } },
            user: { connect: { id: requestedUserId } },
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
