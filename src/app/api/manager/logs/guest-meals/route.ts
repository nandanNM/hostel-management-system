import { endOfMonth, startOfMonth } from "date-fns"
import { toZonedTime } from "date-fns-tz"

import { UserRoleType } from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== UserRoleType.MANAGER)
      return Response.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const timeZone = "Asia/Kolkata"
    const now = toZonedTime(new Date(), timeZone)

    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10)
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10) - 1

    const refDate = new Date(year, month, 1)
    const from = startOfMonth(refDate)
    const to = endOfMonth(refDate)

    const data = await prisma.guestMeal.findMany({
      where: {
        date: { gte: from, lte: to },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
    })

    return Response.json(data)
  } catch (error) {
    console.error("GET /api/manager/logs/guest-meals error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
