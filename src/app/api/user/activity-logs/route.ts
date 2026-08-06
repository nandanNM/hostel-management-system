import { istStartOfDaysAgo } from "@/lib/date"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get("days") ?? "7", 10), 90)
    const from = istStartOfDaysAgo(days - 1)

    const data = await prisma.activityLog.findMany({
      where: {
        userId: session.user.id,
        timestamp: { gte: from },
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
    console.error("GET /api/user/activity-logs error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
