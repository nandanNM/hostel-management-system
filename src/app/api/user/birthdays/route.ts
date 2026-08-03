import { differenceInCalendarDays } from "date-fns"

import { istWallClock } from "@/lib/date"
import { UserStatusType } from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

const WINDOW_DAYS = 3

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const users = await prisma.user.findMany({
      where: {
        status: UserStatusType.ACTIVE,
        deletedAt: null,
        dob: { not: null },
      },
      select: { id: true, name: true, image: true, dob: true },
    })

    const today = istWallClock()

    const upcoming = users
      .map((u) => {
        const dob = istWallClock(u.dob as Date)
        let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        let daysUntil = differenceInCalendarDays(next, today)
        if (daysUntil < 0) {
          next = new Date(
            today.getFullYear() + 1,
            dob.getMonth(),
            dob.getDate()
          )
          daysUntil = differenceInCalendarDays(next, today)
        }
        return { id: u.id, name: u.name, image: u.image, daysUntil }
      })
      .filter((u) => u.daysUntil >= 0 && u.daysUntil <= WINDOW_DAYS)
      .sort((a, b) => a.daysUntil - b.daysUntil)

    return Response.json(upcoming)
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
