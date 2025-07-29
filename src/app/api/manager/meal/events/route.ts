import { endOfDay, startOfDay } from "date-fns"

import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"
import { getCurrentMealSlot } from "@/lib/utils"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    if (!session?.user.hostelId)
      return Response.json(
        { error: "Unauthorized - Hostel ID not found " },
        { status: 401 }
      )
    const mealTime = getCurrentMealSlot()
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const data = await prisma.userMealEvent.findFirst({
      where: {
        mealTime: mealTime,
        hostelId: session.user.hostelId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return Response.json(data)
  } catch (error) {
    console.log(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
