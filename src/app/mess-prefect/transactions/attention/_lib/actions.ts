"use server"

import { unstable_noStore as noStore } from "next/cache"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { ApiResponse } from "@/types"

import { formatIST, istDaysBetween } from "@/lib/date"
import { sendDuesReminderEmail } from "@/lib/email"
import {
  NotificationType,
  UserRoleType,
  UserStatusType,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { sendPushToUsers } from "@/lib/push"

import { settleDues } from "./dues"
import {
  reminderSchema,
  type AttentionResponse,
  type AttentionRow,
  type AttentionSearch,
  type SendRemindersInput,
} from "./validations"

const ACTIVE_BOARDER = {
  role: UserRoleType.STUDENT,
  status: UserStatusType.ACTIVE,
  deletedAt: null,
} as const

/**
 * Builds the full boarder-level list for a tab.
 *
 * Both tabs are aggregates over the bill ledger rather than plain rows, so the
 * set has to be assembled before it can be searched, filtered or paged. The
 * population is one hostel's active boarders, so doing that here is cheap —
 * and it all still happens on the server.
 */
async function buildRows(
  type: AttentionSearch["type"]
): Promise<AttentionRow[]> {
  const now = new Date()

  // The whole ledger for active boarders, because a payment is not tied to the
  // charge it settles - the position only falls out once each boarder's rows
  // are read together. One hostel's ledger, so this stays small.
  const entries = await prisma.userBill.findMany({
    where: { user: ACTIVE_BOARDER },
    select: {
      userId: true,
      amount: true,
      dueDate: true,
      issueDate: true,
      user: { select: { name: true, email: true, image: true } },
    },
  })

  const byUser = new Map<
    string,
    { name: string; email: string; image: string | null; rows: typeof entries }
  >()
  for (const entry of entries) {
    const bucket = byUser.get(entry.userId) ?? {
      name: entry.user.name ?? "Boarder",
      email: entry.user.email,
      image: entry.user.image,
      rows: [],
    }
    bucket.rows.push(entry)
    byUser.set(entry.userId, bucket)
  }

  const rows: AttentionRow[] = []

  for (const [userId, boarder] of byUser) {
    const position = settleDues(boarder.rows, now)

    // The dues tab is everyone carrying a balance; the overdue tab is only
    // those whose unpaid charges have already fallen due.
    const amount =
      type === "overdue" ? position.overdueAmount : position.outstanding
    if (amount <= 0.005) continue

    rows.push({
      userId,
      name: boarder.name,
      email: boarder.email,
      image: boarder.image,
      amount,
      overdueCount: position.overdueCount,
      oldestDueDate: position.oldestDueDate,
      daysOverdue: position.oldestDueDate
        ? Math.max(0, istDaysBetween(position.oldestDueDate, now))
        : 0,
    })
  }

  return rows
}

function compare(a: AttentionRow, b: AttentionRow, column: string) {
  switch (column) {
    case "name":
      return a.name.localeCompare(b.name)
    case "overdueCount":
      return a.overdueCount - b.overdueCount
    case "daysOverdue":
      return a.daysOverdue - b.daysOverdue
    default:
      return a.amount - b.amount
  }
}

export async function getAttentionRows(
  input: AttentionSearch
): Promise<AttentionResponse> {
  noStore()
  await requireMessPrefect()

  let rows = await buildRows(input.type)

  if (input.days > 0) {
    rows = rows.filter((row) => row.daysOverdue >= input.days)
  }

  if (input.name) {
    const needle = input.name.toLowerCase()
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle)
    )
  }

  // `sort` arrives as "column.desc" from the data table.
  const [sortColumn, sortDirection] = (input.sort ?? "amount.desc").split(".")
  const descending = sortDirection !== "asc"
  rows.sort((a, b) => {
    const result = compare(a, b, sortColumn ?? "amount")
    return descending ? -result : result
  })

  const totalRows = rows.length
  const start = (input.page - 1) * input.per_page

  return {
    data: rows.slice(start, start + input.per_page),
    totalRows,
    pageCount: Math.max(1, Math.ceil(totalRows / input.per_page)),
  }
}

/**
 * Sends a dues reminder over push, email and the in-app notification feed.
 * Amounts are recomputed here rather than trusted from the client, so a
 * tampered payload cannot make the app email a boarder the wrong figure.
 */
export async function sendDuesReminders(
  input: SendRemindersInput
): Promise<ApiResponse & { pushed?: number; emailed?: number }> {
  const session = await requireMessPrefect()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = reminderSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    }
  }
  const { userIds, type } = parsed.data

  try {
    const rows = await buildRows(type)
    const selected = rows.filter((row) => userIds.includes(row.userId))

    if (selected.length === 0) {
      return { status: "error", message: "No matching boarders to remind." }
    }

    // Sent one at a time, like the birthday cron. Firing a whole selection at
    // Resend concurrently trips its per-second rate limit, and `sendEmail`
    // swallows the resulting failures — the prefect would be told the mail
    // went out when most of it had not.
    let emailed = 0
    for (const row of selected) {
      const ok = await sendDuesReminderEmail({
        to: row.email,
        name: row.name,
        outstanding: row.amount,
        overdueCount: row.overdueCount,
        oldestDueLabel: row.oldestDueDate ? formatIST(row.oldestDueDate) : null,
      })
      if (ok) emailed += 1
    }

    const title = "Mess dues reminder"

    const [{ sent }] = await Promise.all([
      sendPushToUsers(
        selected.map((row) => row.userId),
        {
          title,
          body: "You have outstanding mess dues. Please clear them at the earliest.",
          icon: "/app-icon-192.png",
          url: "/dashboard",
          tag: `dues-reminder-${Date.now()}`,
        }
      ),
      prisma.notification.createMany({
        data: selected.map((row) => ({
          title,
          message: `You have ₹${row.amount.toFixed(2)} in outstanding mess dues.`,
          type: NotificationType.PAYMENT,
          recipientId: row.userId,
          issuerId: actorId,
        })),
      }),
      prisma.activityLog.create({
        data: {
          userId: actorId,
          actionType: "DUES_REMINDER_SENT",
          entityType: "USER",
          entityId: actorId,
          newData: { type, recipientCount: selected.length },
          details: `Sent a ${type} reminder to ${selected.length} boarder${
            selected.length === 1 ? "" : "s"
          }.`,
        },
      }),
    ])

    return {
      status: "success",
      message: `Reminder sent to ${selected.length} boarder${
        selected.length === 1 ? "" : "s"
      } (${sent} push, ${emailed} email).`,
      pushed: sent,
      emailed,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to send reminders.",
    }
  }
}
