import { toZonedTime } from "date-fns-tz"

import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

const TZ = "Asia/Kolkata"
const TOP_N = 10

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const now = toZonedTime(new Date(), TZ)
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const toDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    )

    const grouped = await prisma.mealAttendance.groupBy({
      by: ["userId"],
      where: { date: { gte: fromDate, lte: toDate } },
      _count: { _all: true },
    })

    grouped.sort((a, b) => b._count._all - a._count._all)
    const top = grouped.slice(0, TOP_N)

    const users = await prisma.user.findMany({
      where: { id: { in: top.map((g) => g.userId) }, deletedAt: null },
      select: { id: true, name: true, image: true },
    })
    const byId = new Map(users.map((u) => [u.id, u]))

    const leaders = top
      .filter((g) => byId.has(g.userId))
      .map((g, index) => {
        const user = byId.get(g.userId)!
        return {
          rank: index + 1,
          id: user.id,
          name: user.name,
          image: user.image,
          count: g._count._all,
          isYou: user.id === session.user.id,
        }
      })

    return Response.json(leaders)
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
