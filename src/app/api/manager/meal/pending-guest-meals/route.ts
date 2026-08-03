import { canManage } from "@/lib/authz"
import { istEndOfDay, istStartOfDay } from "@/lib/date"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (!canManage(session.user.role))
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 }
      )
    // `date` is a day-key column, so bound it with the same convention.
    // The India-day window, so a request booked for today via the date picker
    // is not filed under yesterday.
    const todayStart = istStartOfDay()
    const todayEnd = istEndOfDay()

    const data = await prisma.guestMeal.findMany({
      where: {
        status: "PENDING",
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    return Response.json(data)
  } catch (error) {
    console.log(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
