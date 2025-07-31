import { NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"

import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id || !session.user.hostelId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const monthParam = req.nextUrl.searchParams.get("month")
    const yearParam = req.nextUrl.searchParams.get("year")

    if (!monthParam || !yearParam) {
      return NextResponse.json(
        { error: "Missing month or year" },
        { status: 400 }
      )
    }

    const month = parseInt(monthParam, 10)
    const year = parseInt(yearParam, 10)

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid month or year" },
        { status: 400 }
      )
    }

    const fromDate = new Date(year, month - 1, 1) // e.g., 2025-07-01
    const toDate = new Date(year, month, 0) // e.g., 2025-07-31

    const attendance = (await prisma.mealAttendance.findMany({
      where: {
        hostelId: session.user.hostelId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
        isPresent: true,
      },
      select: {
        userId: true,
        date: true,
      },
    })) as { userId: string; date: Date }[]

    const grouped: Record<string, Set<string>> = {}

    for (const { userId, date } of attendance) {
      const dateStr = format(date, "yyyy-MM-dd")
      if (!grouped[dateStr]) grouped[dateStr] = new Set()
      grouped[dateStr].add(userId)
    }
    const result = Object.entries(grouped).map(([date, userSet]) => ({
      date,
      userIds: Array.from(userSet),
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error("[attendance-summary]", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
