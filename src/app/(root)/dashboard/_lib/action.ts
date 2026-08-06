"use server"

import { ApiResponse } from "@/types"
import { endOfMonth, startOfMonth } from "date-fns"

import { BillEntryType, MealStatusType } from "@/lib/generated/prisma"
import {
  getMealPreferenceLock,
  MEAL_PREFERENCE_LOCK_MESSAGE,
} from "@/lib/meal-lock"
import prisma from "@/lib/prisma"
import {
  checkRateLimit,
  describeRetryAfter,
  mealToggleLimiter,
} from "@/lib/ratelimit"
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

  const limit = await checkRateLimit(
    mealToggleLimiter,
    `meal-toggle:${session.user.id}`
  )
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Too many changes. Try again in ${describeRetryAfter(limit.retryAfterSeconds)}.`,
    }
  }

  const { locked } = await getMealPreferenceLock()
  if (locked) {
    return { status: "error", message: MEAL_PREFERENCE_LOCK_MESSAGE }
  }

  try {
    await prisma.$transaction([
      prisma.meal.update({
        where: { userId: session.user.id },
        data: { status },
      }),
      prisma.activityLog.create({
        data: {
          userId: session.user.id,
          actionType: "MEAL_STATUS_CHANGE",
          entityType: "MEAL",
          newData: { status },
          details: `Meal turned ${status === "ACTIVE" ? "ON" : "OFF"}`,
        },
      }),
    ])
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
  const [balanceRemainingDue, totalPaymentsResult, totalMealAttendanceCount] =
    await Promise.all([
      prisma.userBill.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
        select: { balanceRemaining: true },
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
  // console.log(
  //   balanceRemainingDue,
  //   totalPaymentsResult,
  //   totalMealAttendanceCount
  // )
  const totalBalanceRemaining = balanceRemainingDue?.balanceRemaining ?? 0
  const totalPayments = Math.abs(totalPaymentsResult?._sum?.amount ?? 0)
  const totalAttendance = totalMealAttendanceCount ?? 0

  return {
    totalBalanceRemaining,
    totalPayments,
    totalAttendance,
  }
}

export async function getUserFinanceOverview() {
  const session = await requireUser()
  if (!session?.user.id || session.user.status !== "ACTIVE") {
    return null
  }

  const bills = await prisma.userBill.findMany({
    where: { userId: session.user.id },
    orderBy: { issueDate: "desc" },
    select: { type: true, amount: true, balanceRemaining: true },
  })

  const pendingDues = bills[0]?.balanceRemaining ?? 0

  let meal = 0
  let guest = 0
  let fine = 0
  let other = 0
  let paid = 0

  for (const bill of bills) {
    switch (bill.type) {
      case BillEntryType.MEAL_CHARGE:
        meal += bill.amount
        break
      case BillEntryType.GUEST_MEAL_CHARGE:
        guest += bill.amount
        break
      case BillEntryType.FINE_CHARGE:
        fine += bill.amount
        break
      case BillEntryType.SECURITY_DEPOSIT:
      case BillEntryType.ADJUSTMENT_DEBIT:
        other += bill.amount
        break
      case BillEntryType.PAYMENT:
      case BillEntryType.REFUND:
      case BillEntryType.ADJUSTMENT_CREDIT:
        paid += Math.abs(bill.amount)
        break
    }
  }

  const totalCharges = meal + guest + fine + other

  const breakdown = [
    { category: "meal", label: "Meal charges", amount: meal },
    { category: "guest", label: "Guest meals", amount: guest },
    { category: "fine", label: "Fines", amount: fine },
    { category: "other", label: "Other", amount: other },
  ].filter((slice) => slice.amount > 0)

  return {
    totalCharges,
    totalPaid: paid,
    pendingDues,
    totalFines: fine,
    breakdown,
  }
}

export async function sendMealMessage(
  values: MealMessage
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
    await prisma.userMealEvent.create({
      data: {
        userId: session.user.id,
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
