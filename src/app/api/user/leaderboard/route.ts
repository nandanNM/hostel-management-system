import { cached, cacheKeys } from "@/lib/cache"
import {
  istCalendarMonthEnd,
  istCalendarMonthStart,
  istParts,
} from "@/lib/date"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

const TOP_N = 10
// Attendance only changes when a manager generates a count (twice a day), and
// generation invalidates this key anyway - the TTL is just a safety net.
const TTL_SECONDS = 10 * 60

type Leader = {
  rank: number
  id: string
  name: string | null
  image: string | null
  count: number
}

/**
 * The board itself is identical for every boarder, so it is cached under a
 * single key. Only `isYou` is per-request, and that is computed after the
 * cache read - caching per user would multiply keys for no benefit.
 */
async function computeLeaderboard(
  year: number,
  month: number
): Promise<Leader[]> {
  const grouped = await prisma.mealAttendance.groupBy({
    by: ["userId"],
    where: {
      date: {
        gte: istCalendarMonthStart(year, month),
        lte: istCalendarMonthEnd(year, month),
      },
    },
    _count: { _all: true },
  })

  grouped.sort((a, b) => b._count._all - a._count._all)
  const top = grouped.slice(0, TOP_N)

  const users = await prisma.user.findMany({
    where: { id: { in: top.map((g) => g.userId) }, deletedAt: null },
    select: { id: true, name: true, image: true },
  })
  const byId = new Map(users.map((u) => [u.id, u]))

  return top
    .filter((g) => byId.has(g.userId))
    .map((g, index) => {
      const user = byId.get(g.userId)!
      return {
        rank: index + 1,
        id: user.id,
        name: user.name,
        image: user.image,
        count: g._count._all,
      }
    })
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { year, month } = istParts()

    const leaders = await cached(
      cacheKeys.leaderboard(year, month),
      TTL_SECONDS,
      () => computeLeaderboard(year, month)
    )

    return Response.json(
      leaders.map((leader) => ({
        ...leader,
        isYou: leader.id === session.user.id,
      }))
    )
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
