"use server"

import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { addDays, addMonths, format, startOfMonth, subMonths } from "date-fns"

import { formatIST, istWallClock, istYmd } from "@/lib/date"
import {
  BillEntryType,
  GuestMealStatusType,
  UserRoleType,
  UserStatusType,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

import { resolveRange, type TransactionsSearch } from "./validations"

/**
 * Charges are stored positive and payments negative (see
 * `recordUserPayment`, which writes `amount: -amount`), so "billed" sums the
 * charge types as-is and "collected" takes the absolute value of the credits.
 */
const CHARGE_TYPES = new Set<BillEntryType>([
  BillEntryType.MEAL_CHARGE,
  BillEntryType.FINE_CHARGE,
  BillEntryType.GUEST_MEAL_CHARGE,
  BillEntryType.SECURITY_DEPOSIT,
  BillEntryType.ADJUSTMENT_DEBIT,
])

/** Day buckets stay readable up to a quarter; past that we roll up to months. */
const MAX_DAILY_BUCKETS = 92

/**
 * Percentage change against the previous period of equal length. Returns
 * `null` when there is no baseline to compare against — showing "+100%"
 * because the prior period happened to be empty would be a lie.
 */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

export async function getTransactionsOverview(search: TransactionsSearch) {
  await requireMessPrefect()

  const period = resolveRange(search)
  const priorTo = new Date(period.from.getTime() - 1)
  const priorFrom = new Date(
    priorTo.getTime() - (period.to.getTime() - period.from.getTime())
  )

  const now = new Date()

  const [
    bills,
    recent,
    activeBoarders,
    overdueBills,
    pendingGuestMeals,
    guestMealCharges,
    balances,
  ] = await Promise.all([
    prisma.userBill.findMany({
      select: { type: true, amount: true, isPaid: true, issueDate: true },
    }),
    prisma.userBill.findMany({
      where: { issueDate: { gte: period.from, lte: period.to } },
      orderBy: { issueDate: "desc" },
      // Sized so the card lands just under the leaderboard's natural height
      // beside it: the leaderboard sets the row height and the table shrinks
      // to meet it, rather than stretching the leaderboard to match a long
      // table. ~18 rows is the closest whole-row fit to its podium + 10 ranks.
      take: 18,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        issueDate: true,
        user: { select: { name: true, image: true } },
      },
    }),
    prisma.user.count({
      where: {
        role: UserRoleType.STUDENT,
        status: UserStatusType.ACTIVE,
        deletedAt: null,
      },
    }),
    prisma.userBill.count({
      where: {
        isPaid: false,
        dueDate: { lt: now },
        type: { in: [...CHARGE_TYPES] },
      },
    }),
    prisma.guestMeal.count({
      where: { status: GuestMealStatusType.PENDING },
    }),
    // Ranked off guest-meal charges themselves, so "who requests most" and the
    // revenue figure beside it always agree.
    prisma.userBill.groupBy({
      by: ["userId"],
      where: { type: BillEntryType.GUEST_MEAL_CHARGE },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    // Scoped to the same population as `activeBoarders` above, so the two
    // numbers can be shown against each other without one exceeding the other.
    prisma.userBill.groupBy({
      by: ["userId"],
      where: {
        user: {
          role: UserRoleType.STUDENT,
          status: UserStatusType.ACTIVE,
          deletedAt: null,
        },
      },
      _sum: { amount: true },
    }),
  ])

  let meal = 0
  let guest = 0
  let fine = 0
  let finesCollected = 0
  let other = 0
  let guestPaid = 0
  let collected = 0

  const base = startOfMonth(new Date())
  const monthKeys = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(base, 11 - i)
    return { key: format(date, "yyyy-MM"), label: format(date, "MMM") }
  })
  const monthTotals = new Map(monthKeys.map((m) => [m.key, 0]))

  // Pre-seed every bucket in the window so gaps render as zero instead of
  // collapsing the x-axis onto whichever days happen to have bills.
  const byMonth = period.days > MAX_DAILY_BUCKETS
  const series = [] as {
    key: string
    label: string
    meal: number
    guest: number
    fine: number
    other: number
    payment: number
  }[]

  if (byMonth) {
    const end = istWallClock(period.to)
    let cursor = startOfMonth(istWallClock(period.from))
    while (cursor.getTime() <= end.getTime()) {
      series.push({
        key: format(cursor, "yyyy-MM"),
        label: format(cursor, "MMM yy"),
        meal: 0,
        guest: 0,
        fine: 0,
        other: 0,
        payment: 0,
      })
      cursor = addMonths(cursor, 1)
    }
  } else {
    for (let i = 0; i < period.days; i++) {
      const day = addDays(period.from, i)
      series.push({
        key: istYmd(day),
        label: formatIST(day, "dd MMM"),
        meal: 0,
        guest: 0,
        fine: 0,
        other: 0,
        payment: 0,
      })
    }
  }

  const seriesIndex = new Map(series.map((point, i) => [point.key, i]))

  let openingBalance = 0
  let earliestBill: Date | null = null
  const range = { billed: 0, collected: 0, transactions: 0, chargeCount: 0 }
  const prior = { billed: 0, collected: 0, transactions: 0, chargeCount: 0 }
  const mix = { meal: 0, guest: 0, fine: 0, other: 0 }

  for (const bill of bills) {
    if (!earliestBill || bill.issueDate < earliestBill) {
      earliestBill = bill.issueDate
    }

    switch (bill.type) {
      case BillEntryType.MEAL_CHARGE:
        meal += bill.amount
        break
      case BillEntryType.GUEST_MEAL_CHARGE:
        guest += bill.amount
        if (bill.isPaid) guestPaid += bill.amount
        break
      case BillEntryType.FINE_CHARGE:
        fine += bill.amount
        if (bill.isPaid) finesCollected += bill.amount
        break
      case BillEntryType.SECURITY_DEPOSIT:
      case BillEntryType.ADJUSTMENT_DEBIT:
        other += bill.amount
        break
      case BillEntryType.PAYMENT:
      case BillEntryType.REFUND:
      case BillEntryType.ADJUSTMENT_CREDIT:
        collected += Math.abs(bill.amount)
        break
    }

    if (bill.amount > 0) {
      const key = format(bill.issueDate, "yyyy-MM")
      if (monthTotals.has(key)) {
        monthTotals.set(key, monthTotals.get(key)! + bill.amount)
      }
    }

    const at = bill.issueDate.getTime()
    const inRange = at >= period.from.getTime() && at <= period.to.getTime()
    const inPrior = at >= priorFrom.getTime() && at <= priorTo.getTime()
    const isCharge = CHARGE_TYPES.has(bill.type)

    // Balance carried into the window, so the dues sparkline starts from the
    // real outstanding figure rather than from zero.
    if (at < period.from.getTime()) {
      if (isCharge) openingBalance += bill.amount
      else openingBalance -= Math.abs(bill.amount)
    }

    if (!inRange && !inPrior) continue

    const bucket = inRange ? range : prior
    bucket.transactions += 1
    if (isCharge) {
      bucket.billed += bill.amount
      bucket.chargeCount += 1
    } else {
      bucket.collected += Math.abs(bill.amount)
    }

    if (!inRange) continue

    switch (bill.type) {
      case BillEntryType.MEAL_CHARGE:
        mix.meal += bill.amount
        break
      case BillEntryType.GUEST_MEAL_CHARGE:
        mix.guest += bill.amount
        break
      case BillEntryType.FINE_CHARGE:
        mix.fine += bill.amount
        break
      case BillEntryType.SECURITY_DEPOSIT:
      case BillEntryType.ADJUSTMENT_DEBIT:
        mix.other += bill.amount
        break
    }

    const pointKey = byMonth
      ? formatIST(bill.issueDate, "yyyy-MM")
      : istYmd(bill.issueDate)
    const index = seriesIndex.get(pointKey)
    if (index !== undefined) {
      const point = series[index]!
      switch (bill.type) {
        case BillEntryType.MEAL_CHARGE:
          point.meal += bill.amount
          break
        case BillEntryType.GUEST_MEAL_CHARGE:
          point.guest += bill.amount
          break
        case BillEntryType.FINE_CHARGE:
          point.fine += bill.amount
          break
        case BillEntryType.SECURITY_DEPOSIT:
        case BillEntryType.ADJUSTMENT_DEBIT:
          point.other += bill.amount
          break
        case BillEntryType.PAYMENT:
        case BillEntryType.REFUND:
        case BillEntryType.ADJUSTMENT_CREDIT:
          point.payment += Math.abs(bill.amount)
          break
      }
    }
  }

  // Who owes the most, right now. Dues are a running balance rather than a
  // flow, so this board is deliberately all-time and ignores the date filter.
  const TOP_DEBTORS = 10
  const dueRows = balances
    .map((row) => ({ userId: row.userId, amount: row._sum.amount ?? 0 }))
    .filter((row) => row.amount > 0.005)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_DEBTORS)

  const dueUsers = dueRows.length
    ? await prisma.user.findMany({
        where: { id: { in: dueRows.map((row) => row.userId) } },
        select: { id: true, name: true, image: true, roomNo: true },
      })
    : []
  const dueUserById = new Map(dueUsers.map((user) => [user.id, user]))

  const leaderboard = dueRows
    .filter((row) => dueUserById.has(row.userId))
    .map((row, index) => {
      const user = dueUserById.get(row.userId)!
      return {
        userId: user.id,
        rank: index + 1,
        userName: user.name ?? "Boarder",
        byline: user.roomNo ? `Room ${user.roomNo}` : undefined,
        value: Math.round(row.amount),
        avatarUrl: user.image,
      }
    })

  const TOP_REQUESTERS = 5
  const requesterRows = guestMealCharges
    .map((row) => ({
      userId: row.userId,
      amount: row._sum.amount ?? 0,
      count: row._count._all,
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_REQUESTERS)

  const requesterUsers = requesterRows.length
    ? await prisma.user.findMany({
        where: { id: { in: requesterRows.map((row) => row.userId) } },
        select: { id: true, name: true, image: true },
      })
    : []
  const requesterById = new Map(requesterUsers.map((user) => [user.id, user]))

  const guestMeals = {
    revenue: guest,
    paid: guestPaid,
    unpaid: Math.max(0, guest - guestPaid),
    pending: pendingGuestMeals,
    topRequesters: requesterRows
      .filter((row) => requesterById.has(row.userId))
      .map((row) => {
        const user = requesterById.get(row.userId)!
        return {
          userId: user.id,
          name: user.name ?? "Boarder",
          image: user.image,
          amount: Math.round(row.amount),
          count: row.count,
        }
      }),
  }

  const totalCharges = meal + guest + fine + other
  const outstanding = Math.max(0, totalCharges - collected)

  const breakdown = [
    { category: "meal", label: "Meal charges", amount: meal },
    { category: "guest", label: "Guest meals", amount: guest },
    { category: "fine", label: "Fines", amount: fine },
    { category: "other", label: "Other", amount: other },
  ].filter((slice) => slice.amount > 0)

  const rangeMix = [
    { category: "meal", label: "Meal charges", amount: mix.meal },
    { category: "guest", label: "Guest meals", amount: mix.guest },
    { category: "fine", label: "Fines", amount: mix.fine },
    { category: "other", label: "Other", amount: mix.other },
  ].filter((slice) => slice.amount > 0)

  const monthly = monthKeys.map((m) => ({
    month: m.label,
    total: Math.round(monthTotals.get(m.key)!),
  }))

  // Running outstanding across the window, carried in from everything billed
  // and paid before it, so the dues sparkline starts at the real balance.
  const billedAt = (point: (typeof series)[number]) =>
    point.meal + point.guest + point.fine + point.other

  let running = openingBalance
  const duesPoints = series.map((point) => {
    running += billedAt(point) - point.payment
    return { value: Math.round(running) }
  })

  const rangeFines = series.reduce((total, point) => total + point.fine, 0)

  const sparklines = {
    charges: series.map((point) => ({ value: Math.round(billedAt(point)) })),
    collected: series.map((point) => ({ value: Math.round(point.payment) })),
    dues: duesPoints,
    fines: series.map((point) => ({ value: Math.round(point.fine) })),
  }

  const rate = (billed: number, paid: number) =>
    billed > 0 ? (paid / billed) * 100 : 0
  const average = (total: number, count: number) =>
    count > 0 ? total / count : 0

  const boardersWithDues = balances.filter(
    (row) => (row._sum.amount ?? 0) > 0.005
  ).length

  return {
    totalCharges,
    totalCollected: collected,
    totalOutstanding: outstanding,
    totalFines: fine,
    finesCollected,
    breakdown,
    monthly,
    period: {
      from: period.from,
      to: period.to,
      days: period.days,
      label: period.label,
      preset: period.preset,
    },
    range: {
      billed: range.billed,
      collected: range.collected,
      transactions: range.transactions,
      fines: rangeFines,
      avgCharge: average(range.billed, range.chargeCount),
      collectionRate: rate(range.billed, range.collected),
      deltas: {
        billed: percentChange(range.billed, prior.billed),
        collected: percentChange(range.collected, prior.collected),
        transactions: percentChange(range.transactions, prior.transactions),
        avgCharge: percentChange(
          average(range.billed, range.chargeCount),
          average(prior.billed, prior.chargeCount)
        ),
        collectionRate: percentChange(
          rate(range.billed, range.collected),
          rate(prior.billed, prior.collected)
        ),
      },
    },
    series: series.map((point) => ({
      label: point.label,
      meal: Math.round(point.meal),
      guest: Math.round(point.guest),
      fine: Math.round(point.fine),
      other: Math.round(point.other),
      payment: Math.round(point.payment),
    })),
    granularity: byMonth ? ("month" as const) : ("day" as const),
    sparklines,
    leaderboard,
    duesSpan: { from: earliestBill ?? period.from, to: now },
    rangeMix,
    boarders: {
      active: activeBoarders,
      withDues: boardersWithDues,
    },
    attention: {
      overdueBills,
      boardersWithDues,
    },
    guestMeals,
    recent: recent.map((bill) => ({
      id: bill.id,
      type: bill.type,
      amount: bill.amount,
      description: bill.description,
      issueDate: bill.issueDate,
      userName: bill.user.name,
      userImage: bill.user.image,
    })),
  }
}
