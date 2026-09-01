"use server"

import { unstable_noStore as noStore } from "next/cache"
import requireManager from "@/data/manager/require-manager"

import { ACTIVITY_LOG_ACTION_TYPES } from "@/lib/activity-log-display"
import { istResolveLogRange, istYmd } from "@/lib/date"
import { Prisma } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

import { ActivityLogsSearch } from "./validations"

export interface ActivityLogRow {
  id: string
  actionType: string
  entityType: string | null
  entityId: string | null
  oldData: unknown
  newData: unknown
  timestamp: Date
  details: string | null
  user: { name: string | null; email: string }
  /** Flat, filterable copy of user.name/email - a DataTableFilterField needs
   *  a real key on the row, not a computed/nested one. */
  actor: string
}

export interface ActivityLogsResponse {
  data: ActivityLogRow[]
  totalRows: number
  pageCount: number
  range: { from: string; to: string }
}

export async function getActivityLogsForManager(
  input: ActivityLogsSearch
): Promise<ActivityLogsResponse> {
  noStore()
  // MessPrefect passes this guard too.
  await requireManager()

  const { from, to } = istResolveLogRange(input.from, input.to)

  const actionTypes = input.actionType
    ? input.actionType
        .split(".")
        .filter((value): value is (typeof ACTIVITY_LOG_ACTION_TYPES)[number] =>
          (ACTIVITY_LOG_ACTION_TYPES as readonly string[]).includes(value)
        )
    : []

  const filters: Prisma.ActivityLogWhereInput[] = []
  if (actionTypes.length > 0) filters.push({ actionType: { in: actionTypes } })
  if (input.details)
    filters.push({ details: { contains: input.details, mode: "insensitive" } })
  if (input.actor) {
    filters.push({
      user: {
        OR: [
          { name: { contains: input.actor, mode: "insensitive" } },
          { email: { contains: input.actor, mode: "insensitive" } },
        ],
      },
    })
  }

  const whereClause: Prisma.ActivityLogWhereInput = {
    AND: [{ timestamp: { gte: from, lte: to } }, ...filters],
  }

  const [rows, totalRows] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereClause,
      select: {
        id: true,
        actionType: true,
        entityType: true,
        entityId: true,
        oldData: true,
        newData: true,
        timestamp: true,
        details: true,
        user: { select: { name: true, email: true } },
      },
      skip: (input.page - 1) * input.per_page,
      take: input.per_page,
      orderBy: { timestamp: "desc" },
    }),
    prisma.activityLog.count({ where: whereClause }),
  ])

  const data: ActivityLogRow[] = rows.map((row) => ({
    ...row,
    actor: row.user.name ?? row.user.email,
  }))

  return {
    data,
    totalRows,
    pageCount: Math.max(1, Math.ceil(totalRows / input.per_page)),
    range: { from: istYmd(from), to: istYmd(to) },
  }
}
