"use server"

import { unstable_noStore as noStore } from "next/cache"

import { ACTIVITY_LOG_ACTION_TYPES } from "@/lib/activity-log-display"
import { istResolveLogRange } from "@/lib/date"
import { Prisma } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"

import { ActivityLogsSearch } from "./validations"

export interface MyActivityLogRow {
  id: string
  actionType: string
  entityType: string | null
  entityId: string | null
  oldData: unknown
  newData: unknown
  timestamp: Date
  details: string | null
}

export interface MyActivityLogsResponse {
  data: MyActivityLogRow[]
  totalRows: number
  pageCount: number
}

export async function getMyActivityLogs(
  input: ActivityLogsSearch
): Promise<MyActivityLogsResponse> {
  noStore()
  const session = await requireUser()

  const { from, to } = istResolveLogRange(input.from, input.to)

  const actionTypes = input.actionType
    ? input.actionType
        .split(".")
        .filter((value): value is (typeof ACTIVITY_LOG_ACTION_TYPES)[number] =>
          (ACTIVITY_LOG_ACTION_TYPES as readonly string[]).includes(value)
        )
    : []

  const whereClause: Prisma.ActivityLogWhereInput = {
    userId: session.user.id,
    timestamp: { gte: from, lte: to },
    ...(actionTypes.length > 0 && { actionType: { in: actionTypes } }),
    ...(input.details && {
      details: { contains: input.details, mode: "insensitive" },
    }),
  }

  const [data, totalRows] = await Promise.all([
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
      },
      skip: (input.page - 1) * input.per_page,
      take: input.per_page,
      orderBy: { timestamp: "desc" },
    }),
    prisma.activityLog.count({ where: whereClause }),
  ])

  return {
    data,
    totalRows,
    pageCount: Math.max(1, Math.ceil(totalRows / input.per_page)),
  }
}
