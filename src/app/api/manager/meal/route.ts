import { canManage, isManager } from "@/lib/authz"
import { formatIST, istCalendarDay, istCalendarDayEnd } from "@/lib/date"
import {
  DayOfWeek,
  GuestMealStatusType,
  MealStatusType,
  MealType,
  NonVegType,
  UserStatusType,
} from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"
import { getCurrentMealSlot } from "@/lib/utils"

import {
  calculateActualNonVegMeal,
  getNonVegTypeFromItemName,
} from "./_lib/utils"

export async function GET() {
  try {
    const session = await getSession()
    const user = session?.user
    if (!user?.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (!canManage(user.role))
      return Response.json(
        { error: "Unauthorized - Manager access only" },
        { status: 401 }
      )

    const todayStart = istCalendarDay()
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

    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isManager(session.user.role)) {
      return Response.json(
        { error: "Only a manager can generate the meal count" },
        { status: 401 }
      )
    }

    const generatedById = session.user.id

    const now = new Date()
    const mealTime = getCurrentMealSlot(now)
    // `guest_meals.date` and `daily_meal_activities.meal_date` are day-keys.
    const todayStart = istCalendarDay(now)
    const todayEnd = istCalendarDayEnd(now)
    const dayOfWeek = formatIST(now, "EEEE").toUpperCase() as DayOfWeek

    const alreadyGenerated = await prisma.dailyMealActivity.findFirst({
      where: {
        mealTime,
        date: todayStart,
      },
    })

    if (alreadyGenerated) {
      return Response.json({ error: "Already Generated" }, { status: 400 })
    }

    // Determine today's non-veg offering from the meal schedule
    const todayScheduleEntry = await prisma.mealScheduleEntry.findUnique({
      where: { dayOfWeek_mealTime: { dayOfWeek, mealTime } },
      include: { menuItems: { include: { menuItem: true } } },
    })

    const hasSchedule = !!todayScheduleEntry
    let hostelDailyOffering: NonVegType | null = null

    if (hasSchedule && todayScheduleEntry.menuItems.length > 0) {
      for (const mi of todayScheduleEntry.menuItems) {
        const nvType = getNonVegTypeFromItemName(mi.menuItem.name)
        if (nvType !== NonVegType.NONE) {
          hostelDailyOffering = nvType
          break
        }
      }
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
          nonVegType: true,
          dislikedNonVegTypes: true,
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
          nonVegType: true,
        },
      }),
    ])

    let vegCount = 0
    let chickenCount = 0
    let fishCount = 0
    let eggCount = 0
    const attendanceRecordsToCreate: {
      userId: string
      mealTime: "LUNCH" | "DINNER"
      date: Date
      mealId: string
    }[] = []

    for (const meal of allRegularMeals) {
      if (meal.type === MealType.VEG) {
        vegCount++
      } else if (hasSchedule) {
        // Apply priority chain: from today's offering downward, find the first type the user accepts
        const actualType = calculateActualNonVegMeal(
          meal.nonVegType !== NonVegType.NONE
            ? meal.nonVegType
            : NonVegType.CHICKEN,
          meal.dislikedNonVegTypes,
          hostelDailyOffering
        )
        if (actualType === NonVegType.CHICKEN) chickenCount++
        else if (actualType === NonVegType.FISH) fishCount++
        else if (actualType === NonVegType.EGG) eggCount++
        else vegCount++ // disliked all available non-veg → falls back to veg
      } else {
        // No schedule configured: count as generic non-veg in chickenCount for backward compat
        chickenCount++
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
        // Guest meals are counted by their explicitly requested non-veg type
        if (guestMeal.nonVegType === NonVegType.FISH) fishCount += numMeals
        else if (guestMeal.nonVegType === NonVegType.EGG) eggCount += numMeals
        else chickenCount += numMeals // CHICKEN, MUTTON, or NONE fallback
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
          totalNonvegChicken: chickenCount,
          totalNonvegFish: fishCount,
          totalNonvegEgg: eggCount,
          actualNonVegServed: hostelDailyOffering,
          generatedById,
        },
      })

      if (attendanceRecordsToCreate.length > 0) {
        await tx.mealAttendance.createMany({
          data: attendanceRecordsToCreate,
        })
      }

      // Log it too, so the mess prefect sees the generation in Activity Logs
      // alongside everything else, not only on the meal count screen.
      await tx.activityLog.create({
        data: {
          userId: generatedById,
          actionType: "MEAL_COUNT_GENERATED",
          entityType: "DAILY_MEAL_ACTIVITY",
          entityId: mealActivity.id,
          newData: {
            mealTime,
            totalMeal: totalMeals,
            totalGuestMeal: guestTotalMeals,
          },
          details: `Generated the ${mealTime.toLowerCase()} meal count (${totalMeals} meals).`,
        },
      })

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
