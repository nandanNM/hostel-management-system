"use server"

import { ApiResponse } from "@/types"
import { endOfMonth, startOfMonth } from "date-fns"

import { BillEntryType, MealStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"

import { MealMessage } from "./validation"

export async function toggleMealStatus(
  status: MealStatusType
): Promise<ApiResponse> {
  const session = await requireUser()
  if (!session?.user.id) {
    return {
      status: "error",
      message: "Unauthorized",
    }
  }
  if (session.user.status !== "ACTIVE") {
    return {
      status: "error",
      message: "Unauthorized - You are not a boarder member",
    }
  }
  try {
    await prisma.meal.update({
      where: {
        userId: session.user.id,
      },
      data: {
        status,
      },
    })
    return {
      status: "success",
      message: "Meal status updated successfully",
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

export async function getUserDeshboardStats() {
  const session = await requireUser()
  if (!session?.user.id) {
    return {
      status: "error",
      message: "Unauthorized",
    }
  }
  if (session.user.status !== "ACTIVE") {
    return {
      status: "error",
      message: "Unauthorized - You are not a boarder member",
    }
  }
  const now = new Date()
  const [
    balanceRemainingSumResult,
    totalPaymentsResult,
    totalMealAttendanceCount,
  ] = await Promise.all([
    prisma.userBill.aggregate({
      _sum: {
        balanceRemaining: true,
      },
      where: {
        userId: session.user.id,
        balanceRemaining: { gt: 0 },
      },
    }),
    prisma.userBill.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        userId: session.user.id,
        type: BillEntryType.PAYMENT,
      },
    }),
    prisma.mealAttendance.count({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
        },
      },
    }),
  ])
  const totalBalanceRemaining =
    balanceRemainingSumResult._sum.balanceRemaining ?? 0
  const totalPayments = totalPaymentsResult._sum.amount ?? 0
  const totalAttendance = totalMealAttendanceCount ?? 0

  return {
    totalBalanceRemaining,
    totalPayments,
    totalAttendance,
  }
}

export async function sendMealMessage(
  values: MealMessage
): Promise<ApiResponse> {
  const session = await requireUser()
  if (!session?.user.id || !session?.user.hostelId) {
    return {
      status: "error",
      message: "Unauthorized",
    }
  }
  if (session.user.status !== "ACTIVE") {
    return {
      status: "error",
      message: "Unauthorized - You are not a boarder member",
    }
  }
  try {
    await prisma.userMealEvent.create({
      data: {
        userId: session.user.id,
        hostelId: session.user.hostelId,
        ...values,
      },
    })
    return {
      status: "success",
      message: "Meal message sent successfully",
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
