import { subDays } from "date-fns"

import {
  istCalendarMonthStart,
  istParts,
  istStartOfDaysAgo,
  istYmd,
} from "@/lib/date"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

const MAX_STREAK_DAYS = 31

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const from = istStartOfDaysAgo(MAX_STREAK_DAYS + 1)

    const rows = await prisma.mealAttendance.findMany({
      where: { userId: session.user.id, date: { gte: from } },
      select: { date: true },
    })

    // Compare India calendar days, not server-local ones.
    const present = new Set(rows.map((r) => istYmd(r.date)))

    const today = new Date()
    let cursor = today
    if (!present.has(istYmd(cursor))) cursor = subDays(cursor, 1)

    let streak = 0
    while (streak < MAX_STREAK_DAYS && present.has(istYmd(cursor))) {
      streak++
      cursor = subDays(cursor, 1)
    }

    const { year, month } = istParts(today)
    const monthStart = istCalendarMonthStart(year, month)
    const monthMeals = rows.filter((r) => r.date >= monthStart).length

    return Response.json({ streak, monthMeals })
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
