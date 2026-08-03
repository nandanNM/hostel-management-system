import { canManage } from "@/lib/authz"
import { istEndOfMonth, istParts, istStartOfMonth } from "@/lib/date"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    if (!canManage(session.user.role))
      return Response.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    // Default to the current month in India, and bound the query with the
    // same day-key convention the `date` column is written with.
    const today = istParts()
    const year = parseInt(searchParams.get("year") ?? String(today.year), 10)
    const month =
      parseInt(searchParams.get("month") ?? String(today.month + 1), 10) - 1

    // India-month instants: a meal booked for the 1st is stored at 18:30Z on
    // the last day of the previous month, so day-key bounds filed it under the
    // wrong month.
    const from = istStartOfMonth(year, month)
    const to = istEndOfMonth(year, month)

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
