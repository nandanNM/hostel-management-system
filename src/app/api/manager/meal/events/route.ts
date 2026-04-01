import { endOfDay, startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"

import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const timeZone = "Asia/Kolkata"
    const now = toZonedTime(new Date(), timeZone)
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const data = await prisma.userMealEvent.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            meals: { select: { type: true, nonVegType: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return Response.json(data)
  } catch (error) {
    console.log(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
