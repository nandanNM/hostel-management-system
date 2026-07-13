import { subDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"

import { canManage } from "@/lib/authz"
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
    const days = Math.min(parseInt(searchParams.get("days") ?? "7", 10), 90)
    const actionTypeParam = searchParams.get("actionType")
    const actionTypes = actionTypeParam
      ? actionTypeParam.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined

    const timeZone = "Asia/Kolkata"
    const now = toZonedTime(new Date(), timeZone)
    const from = subDays(now, days - 1)
    from.setHours(0, 0, 0, 0)

    const data = await prisma.activityLog.findMany({
      where: {
        timestamp: { gte: from },
        ...(actionTypes?.length ? { actionType: { in: actionTypes } } : {}),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 500,
    })

    return Response.json(data)
  } catch (error) {
    console.error("GET /api/manager/logs/activity error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
