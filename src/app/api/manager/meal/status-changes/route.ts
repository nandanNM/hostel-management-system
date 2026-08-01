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
      return Response.json({ error: "Forbidden" }, { status: 403 })

    // Today in India, as real instants (`timestamp` is a true timestamp).
    const todayStart = istStartOfDay()
    const todayEnd = istEndOfDay()

    const data = await prisma.activityLog.findMany({
      where: {
        actionType: "MEAL_STATUS_CHANGE",
        timestamp: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            meals: {
              select: { type: true, nonVegType: true, status: true },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
    })

    return Response.json(data)
  } catch (error) {
    console.log(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
