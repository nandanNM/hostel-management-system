import { NextRequest, NextResponse } from "next/server"
import { MealTimeType } from "@/generated/prisma"
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

    const fromDate = new Date(year, month - 1, 1)
    const toDate = new Date(year, month, 0)

    const attendance = await prisma.mealAttendance.findMany({
      where: {
        hostelId: session.user.hostelId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
        isPresent: true,
      },
      select: {
        mealTime: true,
        userId: true,
        date: true,
      },
    })

    const grouped: Record<string, { lunch: Set<string>; dinner: Set<string> }> =
      {}

    for (const { userId, date, mealTime } of attendance) {
      const dateStr = format(date, "yyyy-MM-dd")
      if (!grouped[dateStr]) {
        grouped[dateStr] = { lunch: new Set(), dinner: new Set() }
      }

      if (mealTime === MealTimeType.LUNCH) {
        grouped[dateStr].lunch.add(userId)
      } else if (mealTime === MealTimeType.DINNER) {
        grouped[dateStr].dinner.add(userId)
      }
    }

    // Convert Set to string[]
    const finalResult: Record<string, { lunch: string[]; dinner: string[] }> =
      {}
    for (const [date, { lunch, dinner }] of Object.entries(grouped)) {
      finalResult[date] = {
        lunch: Array.from(lunch),
        dinner: Array.from(dinner),
      }
    }
    return NextResponse.json(finalResult)
  } catch (err) {
    console.error("[attendance-summary]", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
