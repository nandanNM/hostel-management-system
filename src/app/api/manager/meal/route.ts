import { endOfDay, startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"

import {
  MealStatusType,
  MealType,
  UserRoleType,
  UserStatusType,
  GuestMealStatusType,
} from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"
import { getCurrentMealSlot } from "@/lib/utils"

export async function GET() {
  try {
    const session = await getSession()
    const user = session?.user
    if (!user?.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (user.role !== UserRoleType.MANAGER)
      return Response.json(
        { error: "Unauthorized - Manager access only" },
        { status: 401 }
      )

    const todayStart = startOfDay(new Date())
    const mealTime = getCurrentMealSlot()

    const data = await prisma.dailyMealActivity.findFirst({
      where: {
        mealTime,
        date: todayStart,
      },
    })

    return Response.json(data)
  } catch (error) {
    console.error("GET /daily-meal-activity error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getSession()
    const timeZone = "Asia/Kolkata"
    
    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRoleType.MANAGER) {
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 }
      )
    }

    const now = new Date()
    const zonedDate = toZonedTime(now, timeZone)
    const mealTime = getCurrentMealSlot()
    const todayStart = startOfDay(zonedDate)
    const todayEnd = endOfDay(zonedDate)

    const alreadyGenerated = await prisma.dailyMealActivity.findFirst({
      where: {
        mealTime,
        date: todayStart,
      },
    })

    if (alreadyGenerated) {
      return Response.json({ error: "Already Generated" }, { status: 400 })
    }

    const [allRegularMeals, allActiveGuestMeals] = await Promise.all([
      prisma.meal.findMany({
        where: {
          status: MealStatusType.ACTIVE,
          user: {
            status: UserStatusType.ACTIVE,
          },
        },
        select: {
          id: true,
          userId: true,
          type: true,
        },
      }),
      prisma.guestMeal.findMany({
        where: {
          mealTime,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: GuestMealStatusType.APPROVED,
        },
        select: {
          id: true,
          numberOfMeals: true,
          type: true,
        },
      }),
    ])

    let vegCount = 0
    let nonVegCount = 0
    const attendanceRecordsToCreate: { userId: string; mealTime: "LUNCH" | "DINNER"; date: Date; mealId: string }[] = []

    for (const meal of allRegularMeals) {
      if (meal.type === MealType.VEG) {
        vegCount++
      } else {
        nonVegCount++
      }

      attendanceRecordsToCreate.push({
        userId: meal.userId,
        mealTime,
        date: todayStart,
        mealId: meal.id,
      })
    }

    let guestTotalMeals = 0
    for (const guestMeal of allActiveGuestMeals) {
      const numMeals = guestMeal.numberOfMeals
      guestTotalMeals += numMeals

      if (guestMeal.type === MealType.VEG) {
        vegCount += numMeals
      } else {
        nonVegCount += numMeals
      }
    }

    const totalMeals = allRegularMeals.length + guestTotalMeals

    const result = await prisma.$transaction(async (tx) => {
      const mealActivity = await tx.dailyMealActivity.create({
        data: {
          mealTime,
          totalMeal: totalMeals,
          date: todayStart,
          totalGuestMeal: guestTotalMeals,
          totalVeg: vegCount,
          totalNonvegChicken: nonVegCount, // Keeping schema field but using for total Non-Veg
          totalNonvegFish: 0,
          totalNonvegEgg: 0,
        },
      })

      if (attendanceRecordsToCreate.length > 0) {
        await tx.mealAttendance.createMany({
          data: attendanceRecordsToCreate,
        })
      }

      return mealActivity
    })

    return Response.json(result, { status: 200 })
  } catch (error) {
    // console.error("POST /daily-meal-activity error:", error)
    return Response.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
