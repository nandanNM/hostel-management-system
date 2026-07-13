"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import requireManager from "@/data/manager/require-manager"
import { BillEntryType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { ApiResponse } from "@/types"

/**
 * Full billing/activity detail for one user, fetched with a single parallel
 * batch (no N+1). Balance is the latest ledger row's running balance; totals
 * come from indexed aggregates rather than summing rows in JS.
 */
export async function getUserBillingDetail(userId: string) {
  const session = await requireManager()
  if (!session) throw new Error("Unauthorized")

  const [user, latestBill, bills, mealHistory, paidAgg, chargedAgg] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          roomNo: true,
          selfPhNo: true,
          role: true,
          status: true,
          joinDate: true,
          createdAt: true,
        },
      }),
      prisma.userBill.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { balanceRemaining: true },
      }),
      prisma.userBill.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          balanceRemaining: true,
          isPaid: true,
          issueDate: true,
          dueDate: true,
          createdAt: true,
        },
      }),
      prisma.activityLog.findMany({
        where: { userId, actionType: "MEAL_STATUS_CHANGE" },
        orderBy: { timestamp: "desc" },
        take: 50,
        select: { id: true, details: true, newData: true, timestamp: true },
      }),
      // PAYMENT ledger amounts are stored negative; negate the sum for total paid.
      prisma.userBill.aggregate({
        where: { userId, type: BillEntryType.PAYMENT },
        _sum: { amount: true },
      }),
      prisma.userBill.aggregate({
        where: {
          userId,
          type: {
            in: [
              BillEntryType.MEAL_CHARGE,
              BillEntryType.FINE_CHARGE,
              BillEntryType.GUEST_MEAL_CHARGE,
              BillEntryType.SECURITY_DEPOSIT,
              BillEntryType.ADJUSTMENT_DEBIT,
            ],
          },
        },
        _sum: { amount: true },
      }),
    ])

  if (!user) throw new Error("User not found")

  return {
    user,
    summary: {
      currentDue: latestBill?.balanceRemaining ?? 0,
      totalPaid: Math.abs(paidAgg._sum.amount ?? 0),
      totalCharged: chargedAgg._sum.amount ?? 0,
    },
    bills,
    payments: bills.filter((b) => b.type === BillEntryType.PAYMENT),
    mealHistory,
  }
}

export type UserBillingDetail = Awaited<
  ReturnType<typeof getUserBillingDetail>
>

const recordPaymentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.string().trim().max(40).optional().default(""),
  transactionId: z.string().trim().max(80).optional().default(""),
})

export type RecordPaymentInput = z.input<typeof recordPaymentSchema>

export async function recordPayment(
  input: RecordPaymentInput
): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = recordPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Invalid payment details provided.",
    }
  }
  const { userId, amount, paymentMethod, transactionId } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })
    if (!target) return { status: "error", message: "User not found" }

    const result = await prisma.$transaction(async (tx) => {
      const lastBill = await tx.userBill.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { balanceRemaining: true },
      })
      const currentDue = lastBill?.balanceRemaining ?? 0
      const newBalance = currentDue - amount

      await tx.userBill.create({
        data: {
          userId,
          type: BillEntryType.PAYMENT,
          amount: -amount,
          description: `Payment received${
            paymentMethod ? ` via ${paymentMethod}` : ""
          }${transactionId ? ` (txn: ${transactionId})` : ""}`,
          balanceRemaining: newBalance,
          issueDate: new Date(),
          isPaid: true,
        },
      })

      await tx.activityLog.create({
        data: {
          userId: actorId,
          actionType: "PAYMENT_RECORDED",
          entityType: "USER",
          entityId: userId,
          newData: { amount, paymentMethod, transactionId },
          details: `Recorded a payment of ₹${amount.toFixed(2)} for ${
            target.name ?? userId
          }.`,
        },
      })

      return { newBalance }
    })

    revalidatePath("/manager/users")
    revalidatePath("/mess-prefect/users")
    return {
      status: "success",
      message: `Payment of ₹${amount.toFixed(2)} recorded. New balance: ₹${result.newBalance.toFixed(2)}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to record the payment.",
    }
  }
}
