import { endOfDay, startOfDay } from "date-fns"

import { UserRoleType } from "@/lib/generated/prisma"
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
    if (session.user.role !== UserRoleType.MANAGER)
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 }
      )
    const mealTime = getCurrentMealSlot()
    const todayStart = startOfDay(new Date()).toISOString()
    const todayEnd = endOfDay(new Date()).toISOString()
    const data = await prisma.guestMeal.findMany({
      where: {
        status: "PENDING",
        mealTime: mealTime,
        hostelId: session.user.hostelId,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    })
    return Response.json(data)
  } catch (error) {
    console.log(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
