import { istEndOfDay, istStartOfDay } from "@/lib/date"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const todayStart = istStartOfDay()
    const todayEnd = istEndOfDay()

    const data = await prisma.userMealEvent.findMany({
      where: {
        createdAt: {
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
