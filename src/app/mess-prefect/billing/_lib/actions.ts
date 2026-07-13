"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { addDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { z } from "zod"

import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import {
  BillEntryType,
  GuestMealStatusType,
  UserStatusType,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { ApiResponse } from "@/types"

const TZ = "Asia/Kolkata"

function resolveMonth(input?: { year: number; month: number }) {
  const nowZoned = toZonedTime(new Date(), TZ)
  const base = input
    ? new Date(input.year, input.month - 1, 1)
    : subMonths(nowZoned, 1)
  const start = startOfMonth(base)
  const end = endOfMonth(base)
  return {
    start,
    end,
    year: start.getFullYear(),
    month: start.getMonth() + 1,
    label: format(start, "MMMM yyyy"),
  }
}

function computeGrandTotal(e: {
  riceExpenses: number
  vegetableExpenses: number
  fishExpenses: number
  dailyExpenses: number
  otherExpenses: number
}) {
  return (
    e.riceExpenses +
    e.vegetableExpenses +
    e.fishExpenses +
    e.dailyExpenses +
    e.otherExpenses
  )
}

// A month can only be billed once it has fully ended (previous months only).
// The UI navigator enforces this too, but guard the server against direct calls.
function isBillableMonth(periodStart: Date) {
  const currentMonthStart = startOfMonth(toZonedTime(new Date(), TZ))
  return periodStart < currentMonthStart
}

export type BillingData = Awaited<ReturnType<typeof getBillingData>>

export async function getBillingData(input?: { year: number; month: number }) {
  noStore()
  await requireMessPrefect()

  const period = resolveMonth(input)
  const dateRange = { gte: period.start, lte: period.end }

  const [audit, activeBoarders, mealActivity, guestAgg] = await Promise.all([
    prisma.audit.findFirst({
      where: { date: dateRange },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { status: UserStatusType.ACTIVE } }),
    prisma.dailyMealActivity.aggregate({
      _sum: { totalMeal: true, totalGuestMeal: true },
      where: { date: dateRange },
    }),
    prisma.guestMeal.aggregate({
      _sum: { mealCharge: true, numberOfMeals: true },
      _count: true,
      where: {
        date: dateRange,
        status: {
          in: [GuestMealStatusType.APPROVED, GuestMealStatusType.SERVED],
        },
      },
    }),
  ])

  const distributedBills = audit
    ? await prisma.userBill.findMany({
        where: { auditId: audit.id, type: BillEntryType.MEAL_CHARGE },
        select: {
          id: true,
          amount: true,
          balanceRemaining: true,
          issueDate: true,
          isPaid: true,
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    : []

  // Guest-meal charges are billed to each user in real time when a manager
  // approves them, so they already sit on the ledger. Here we simply surface
  // each user's approved/served guest charges FOR THE SELECTED MONTH alongside
  // their flat mess charge, so the month's billing record reflects them
  // (no re-charging — display only).
  const guestByUser =
    distributedBills.length > 0
      ? await prisma.guestMeal.groupBy({
          by: ["userId"],
          where: {
            date: dateRange,
            status: {
              in: [GuestMealStatusType.APPROVED, GuestMealStatusType.SERVED],
            },
          },
          _sum: { mealCharge: true },
        })
      : []
  const guestChargeByUser = new Map(
    guestByUser.map((g) => [g.userId, g._sum.mealCharge ?? 0])
  )

  const billRows = distributedBills.map((b) => ({
    id: b.id,
    messCharge: b.amount,
    guestCharge: guestChargeByUser.get(b.user.id) ?? 0,
    balanceRemaining: b.balanceRemaining,
    isPaid: b.isPaid,
    user: b.user,
  }))

  return {
    period: {
      year: period.year,
      month: period.month,
      label: period.label,
    },
    audit,
    isFinalized: !!audit?.approvedAt,
    distributedCount: billRows.length,
    distributedBills: billRows,
    stats: {
      activeBoarders,
      mealsServed: mealActivity._sum.totalMeal ?? 0,
      guestMealsServed: mealActivity._sum.totalGuestMeal ?? 0,
      guestMealCount: guestAgg._count,
      guestMealCharges: guestAgg._sum.mealCharge ?? 0,
    },
  }
}

const draftSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  riceExpenses: z.number().min(0).default(0),
  vegetableExpenses: z.number().min(0).default(0),
  fishExpenses: z.number().min(0).default(0),
  dailyExpenses: z.number().min(0).default(0),
  otherExpenses: z.number().min(0).default(0),
  adjustment: z.number().default(0),
})

export type SaveAuditDraftInput = z.infer<typeof draftSchema>

export async function saveAuditDraft(
  input: SaveAuditDraftInput
): Promise<ApiResponse> {
  const session = await requireMessPrefect()
  if (!session) return { status: "error", message: "Unauthorized" }

  const parsed = draftSchema.safeParse(input)
  if (!parsed.success) {
    return { status: "error", message: "Invalid expense values" }
  }
  const data = parsed.data
  const period = resolveMonth({ year: data.year, month: data.month })

  if (!isBillableMonth(period.start)) {
    return {
      status: "error",
      message: "You can only bill a month after it has ended.",
    }
  }

  try {
    const existing = await prisma.audit.findFirst({
      where: { date: { gte: period.start, lte: period.end } },
      orderBy: { createdAt: "desc" },
    })

    if (existing?.approvedAt) {
      return {
        status: "error",
        message: `Bills for ${period.label} are already finalized and cannot be edited.`,
      }
    }

    const totalBoarders = await prisma.user.count({
      where: { status: UserStatusType.ACTIVE },
    })
    const grandTotalExpenses = computeGrandTotal(data)
    const mealCharge =
      totalBoarders > 0
        ? (grandTotalExpenses + data.adjustment) / totalBoarders
        : 0

    const payload = {
      riceExpenses: data.riceExpenses,
      vegetableExpenses: data.vegetableExpenses,
      fishExpenses: data.fishExpenses,
      dailyExpenses: data.dailyExpenses,
      otherExpenses: data.otherExpenses,
      adjustment: data.adjustment,
      grandTotalExpenses,
      totalBoarders,
      mealCharge,
    }

    if (existing) {
      await prisma.audit.update({
        where: { id: existing.id },
        data: { ...payload, version: { increment: 1 } },
      })
    } else {
      await prisma.audit.create({
        data: {
          ...payload,
          date: period.start,
          auditor: { connect: { id: session.user.id } },
        },
      })
    }

    revalidatePath("/mess-prefect/billing")
    return {
      status: "success",
      message: `Draft saved. Per-boarder charge: ₹${mealCharge.toFixed(2)}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to save the billing draft.",
    }
  }
}

export async function finalizeAndDistributeBills(
  auditId: string
): Promise<ApiResponse> {
  const session = await requireMessPrefect()
  if (!session) return { status: "error", message: "Unauthorized" }

  try {
    const audit = await prisma.audit.findUnique({ where: { id: auditId } })
    if (!audit) return { status: "error", message: "Audit not found." }
    if (audit.approvedAt) {
      return {
        status: "error",
        message: "This month's bills have already been finalized.",
      }
    }
    if (!isBillableMonth(audit.date)) {
      return {
        status: "error",
        message: "You can only finalize a month after it has ended.",
      }
    }

    const activeUsers = await prisma.user.findMany({
      where: { status: UserStatusType.ACTIVE },
      select: { id: true },
    })
    if (activeUsers.length === 0) {
      return { status: "error", message: "There are no active users to bill." }
    }

    const monthLabel = format(audit.date, "MMMM yyyy")
    const dueDate = addDays(new Date(), 15)

    const result = await prisma.$transaction(
      async (tx) => {
        // Re-check the idempotency guards INSIDE the transaction so two
        // concurrent finalize calls can't both distribute (race-safe).
        const fresh = await tx.audit.findUnique({
          where: { id: auditId },
          select: { approvedAt: true },
        })
        if (fresh?.approvedAt) {
          throw new Error("This month's bills have already been finalized.")
        }
        const alreadyDistributed = await tx.userBill.count({
          where: { auditId, type: BillEntryType.MEAL_CHARGE },
        })
        if (alreadyDistributed > 0) {
          throw new Error("Bills for this audit have already been distributed.")
        }

        // Latest ledger balance per active user (one row each via distinct).
        const latestBills = await tx.userBill.findMany({
          where: { userId: { in: activeUsers.map((u) => u.id) } },
          orderBy: { createdAt: "desc" },
          distinct: ["userId"],
          select: { userId: true, balanceRemaining: true },
        })
        const balanceByUser = new Map(
          latestBills.map((b) => [b.userId, b.balanceRemaining])
        )

        const rows = activeUsers.map((u) => {
          const currentDue = balanceByUser.get(u.id) ?? 0
          return {
            userId: u.id,
            auditId: audit.id,
            type: BillEntryType.MEAL_CHARGE,
            amount: audit.mealCharge,
            description: `Monthly mess charge for ${monthLabel}`,
            balanceRemaining: currentDue + audit.mealCharge,
            issueDate: new Date(),
            dueDate,
            isPaid: false,
          }
        })

        await tx.userBill.createMany({ data: rows })

        await tx.audit.update({
          where: { id: audit.id },
          data: {
            approvedBy: session.user.id,
            approvedAt: new Date(),
            version: { increment: 1 },
            totalBoarders: activeUsers.length,
          },
        })

        return { count: rows.length }
      },
      { timeout: 30000 }
    )

    revalidatePath("/mess-prefect/billing")
    return {
      status: "success",
      message: `Distributed ₹${audit.mealCharge.toFixed(2)} to ${
        result.count
      } active users for ${monthLabel}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to distribute the bills.",
    }
  }
}
