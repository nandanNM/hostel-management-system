import { differenceInCalendarDays } from "date-fns"

import { cached, cacheKeys, secondsUntilIstMidnight } from "@/lib/cache"
import { istWallClock } from "@/lib/date"
import { UserStatusType } from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

const WINDOW_DAYS = 3

type UpcomingBirthday = {
  id: string
  name: string | null
  image: string | null
  daysUntil: number
}

/**
 * Scans every active boarder, so it is worth not repeating per page view. The
 * result is the same for everyone and only changes when the India date rolls,
 * which is exactly what the TTL is pinned to.
 */
async function computeUpcomingBirthdays(): Promise<UpcomingBirthday[]> {
  const users = await prisma.user.findMany({
    where: {
      status: UserStatusType.ACTIVE,
      deletedAt: null,
      dob: { not: null },
    },
    select: { id: true, name: true, image: true, dob: true },
  })

  const today = istWallClock()

  return users
    .map((u) => {
      const dob = istWallClock(u.dob as Date)
      let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
      let daysUntil = differenceInCalendarDays(next, today)
      if (daysUntil < 0) {
        next = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
        daysUntil = differenceInCalendarDays(next, today)
      }
      return { id: u.id, name: u.name, image: u.image, daysUntil }
    })
    .filter((u) => u.daysUntil >= 0 && u.daysUntil <= WINDOW_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const upcoming = await cached(
      cacheKeys.birthdays(),
      secondsUntilIstMidnight(),
      computeUpcomingBirthdays
    )

    return Response.json(upcoming)
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
