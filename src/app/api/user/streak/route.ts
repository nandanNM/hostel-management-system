import { format, subDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"

import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

const TZ = "Asia/Kolkata"
const MAX_STREAK_DAYS = 31

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const now = toZonedTime(new Date(), TZ)
    const from = subDays(now, MAX_STREAK_DAYS + 1)

    const rows = await prisma.mealAttendance.findMany({
      where: { userId: session.user.id, date: { gte: from } },
      select: { date: true },
    })

    const present = new Set(
      rows.map((r) => format(toZonedTime(r.date, TZ), "yyyy-MM-dd"))
    )

    let cursor = now
    if (!present.has(format(cursor, "yyyy-MM-dd"))) cursor = subDays(cursor, 1)

    let streak = 0
    while (
      streak < MAX_STREAK_DAYS &&
      present.has(format(cursor, "yyyy-MM-dd"))
    ) {
      streak++
      cursor = subDays(cursor, 1)
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthMeals = rows.filter(
      (r) => toZonedTime(r.date, TZ) >= monthStart
    ).length

    return Response.json({ streak, monthMeals })
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
