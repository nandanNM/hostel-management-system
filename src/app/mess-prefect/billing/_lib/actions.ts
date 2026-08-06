"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { after } from "next/server"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { ApiResponse } from "@/types"
import { addDays } from "date-fns"
import { z } from "zod"

import {
  formatIST,
  istCalendarMonthEnd,
  istCalendarMonthStart,
  istEndOfMonth,
  istParts,
  istStartOfMonth,
} from "@/lib/date"
import {
  BillEntryType,
  GuestMealStatusType,
  UserStatusType,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { sendPushToUsers } from "@/lib/push"

function resolveMonth(input?: { year: number; month: number }) {
  const today = istParts()
  let year = today.year
  let month = today.month - 1
  if (input) {
    year = input.year
    month = input.month - 1
  } else if (month < 0) {
    year -= 1
    month = 11
  }

  const start = istCalendarMonthStart(year, month)
  const end = istCalendarMonthEnd(year, month)
  return {
    start,
    end,
    year,
    month: month + 1,
    label: formatIST(start, "MMMM yyyy"),
  }
}

function computeGrandTotal(e: {
  riceExpenses: number
  vegetableExpenses: number
  fishExpenses: number
  groceryExpenses: number
  dailyExpenses: number
  otherExpenses: number
}) {
  return (
    e.riceExpenses +
    e.vegetableExpenses +
    e.fishExpenses +
    e.groceryExpenses +
    e.dailyExpenses +
    e.otherExpenses
  )
}

function computeMealCharge(
  grandTotalExpenses: number,
  adjustment: number,
  billableBoarders: number
) {
  return billableBoarders > 0
    ? (grandTotalExpenses + adjustment) / billableBoarders
    : 0
}

// A month can only be billed once it has fully ended (previous months only).
// The UI navigator enforces this too, but guard the server against direct calls.
function isBillableMonth(periodStart: Date) {
  const { year, month } = istParts()
  return periodStart < istCalendarMonthStart(year, month)
}

export type BillingData = Awaited<ReturnType<typeof getBillingData>>

export async function getBillingData(input?: { year: number; month: number }) {
  noStore()
  await requireMessPrefect()

  const period = resolveMonth(input)
  const dateRange = { gte: period.start, lte: period.end }
  // Guest meal dates are stored in mixed conventions, so they need the true
  // India-month window; day-key bounds bill a meal taken on the 1st to the
  // previous month.
  const guestDateRange = {
    gte: istStartOfMonth(period.year, period.month - 1),
    lte: istEndOfMonth(period.year, period.month - 1),
  }

  const [audit, boarders, mealActivity, guestAgg] = await Promise.all([
    prisma.audit.findFirst({
      where: { date: dateRange },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { status: UserStatusType.ACTIVE },
      select: { id: true, name: true, email: true, image: true, roomNo: true },
      orderBy: { name: "asc" },
    }),
    prisma.dailyMealActivity.aggregate({
      _sum: { totalMeal: true, totalGuestMeal: true },
      where: { date: dateRange },
    }),
    prisma.guestMeal.aggregate({
      _sum: { mealCharge: true, numberOfMeals: true },
      _count: true,
      where: {
        date: guestDateRange,
        status: {
          in: [GuestMealStatusType.APPROVED, GuestMealStatusType.SERVED],
        },
      },
    }),
  ])

  const activeBoarders = boarders.length
  const activeIds = new Set(boarders.map((b) => b.id))
  const excludedUserIds = (audit?.excludedUserIds ?? []).filter((id) =>
    activeIds.has(id)
  )
  const billableBoarders = Math.max(0, activeBoarders - excludedUserIds.length)

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
            date: guestDateRange,
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
    boarders,
    excludedUserIds,
    stats: {
      activeBoarders,
      billableBoarders,
      excludedCount: excludedUserIds.length,
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
  groceryExpenses: z.number().min(0).default(0),
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

    const activeIds = (
      await prisma.user.findMany({
        where: { status: UserStatusType.ACTIVE },
        select: { id: true },
      })
    ).map((u) => u.id)
    const activeIdSet = new Set(activeIds)
    const excludedUserIds = (existing?.excludedUserIds ?? []).filter((id) =>
      activeIdSet.has(id)
    )
    const totalBoarders = Math.max(0, activeIds.length - excludedUserIds.length)
    const grandTotalExpenses = computeGrandTotal(data)
    const mealCharge = computeMealCharge(
      grandTotalExpenses,
      data.adjustment,
      totalBoarders
    )

    const payload = {
      riceExpenses: data.riceExpenses,
      vegetableExpenses: data.vegetableExpenses,
      fishExpenses: data.fishExpenses,
      groceryExpenses: data.groceryExpenses,
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

    const excludedSet = new Set(audit.excludedUserIds)
    const activeUsers = (
      await prisma.user.findMany({
        where: { status: UserStatusType.ACTIVE },
        select: { id: true },
      })
    ).filter((u) => !excludedSet.has(u.id))
    if (activeUsers.length === 0) {
      return {
        status: "error",
        message:
          "There are no boarders to bill (all active users are excluded).",
      }
    }

    const monthLabel = formatIST(audit.date, "MMMM yyyy")
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

    after(() =>
      sendPushToUsers(
        activeUsers.map((u) => u.id),
        {
          title: "Monthly mess bill generated",
          body: `Your mess bill for ${monthLabel} (₹${audit.mealCharge.toFixed(
            2
          )}) has been added. Due by ${formatIST(dueDate, "d MMM yyyy")}.`,
          icon: "/app-icon-192.png",
          url: "/dashboard",
          tag: `monthly-bill-${audit.id}`,
        }
      ).catch((err) => console.error("Push notification failed:", err))
    )

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

const exclusionsSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  excludedUserIds: z.array(z.string().min(1)).default([]),
})

export type SetBillingExclusionsInput = z.infer<typeof exclusionsSchema>

export async function setBillingExclusions(
  input: SetBillingExclusionsInput
): Promise<ApiResponse> {
  const session = await requireMessPrefect()
  if (!session) return { status: "error", message: "Unauthorized" }

  const parsed = exclusionsSchema.safeParse(input)
  if (!parsed.success) {
    return { status: "error", message: "Invalid exclusion selection." }
  }
  const { year, month, excludedUserIds } = parsed.data
  const period = resolveMonth({ year, month })

  if (!isBillableMonth(period.start)) {
    return {
      status: "error",
      message: "You can only edit exclusions for a month after it has ended.",
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

    const activeIds = (
      await prisma.user.findMany({
        where: { status: UserStatusType.ACTIVE },
        select: { id: true },
      })
    ).map((u) => u.id)
    const activeIdSet = new Set(activeIds)
    const cleanExcluded = [...new Set(excludedUserIds)].filter((id) =>
      activeIdSet.has(id)
    )
    const billableBoarders = Math.max(
      0,
      activeIds.length - cleanExcluded.length
    )

    if (existing) {
      const mealCharge = computeMealCharge(
        existing.grandTotalExpenses,
        existing.adjustment,
        billableBoarders
      )
      await prisma.audit.update({
        where: { id: existing.id },
        data: {
          excludedUserIds: cleanExcluded,
          totalBoarders: billableBoarders,
          mealCharge,
          version: { increment: 1 },
        },
      })
    } else {
      await prisma.audit.create({
        data: {
          date: period.start,
          riceExpenses: 0,
          vegetableExpenses: 0,
          fishExpenses: 0,
          groceryExpenses: 0,
          dailyExpenses: 0,
          otherExpenses: 0,
          adjustment: 0,
          grandTotalExpenses: 0,
          totalBoarders: billableBoarders,
          mealCharge: 0,
          excludedUserIds: cleanExcluded,
          auditor: { connect: { id: session.user.id } },
        },
      })
    }

    revalidatePath("/mess-prefect/billing")
    return {
      status: "success",
      message: cleanExcluded.length
        ? `${cleanExcluded.length} boarder(s) excluded from ${period.label}. ${billableBoarders} will be billed.`
        : `No boarders excluded — all ${billableBoarders} active boarders will be billed for ${period.label}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update the billing exclusions.",
    }
  }
}
