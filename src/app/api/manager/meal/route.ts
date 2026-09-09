import { canManage, isManager } from "@/lib/authz"
import { cacheKeys, invalidate } from "@/lib/cache"
import {
  formatIST,
  istCalendarDay,
  istEndOfDay,
  istParts,
  istStartOfDay,
} from "@/lib/date"
import {
  DayOfWeek,
  GuestMealStatusType,
  MealStatusType,
  MealType,
  NonVegType,
  UserStatusType,
} from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import { isMealCountGenerated } from "@/lib/meal-count"
import {
  assignBucket,
  resolveOffers,
  type MealBucket,
} from "@/lib/meal-priority"
import { getMessConfig } from "@/lib/mess-config"
import prisma from "@/lib/prisma"
import { getCurrentMealSlot } from "@/lib/utils"

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
      include: {
        generatedBy: {
          select: { id: true, name: true, image: true },
        },
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
    // Guest meal rows carry three historical date conventions (India midnight
    // from the picker, UTC midnight day-keys, and a raw booking timestamp).
    // The true India-day window is the only range that captures all three
    // without pulling in the neighbouring day.
    const guestDayStart = istStartOfDay(now)
    const guestDayEnd = istEndOfDay(now)
    const dayOfWeek = formatIST(now, "EEEE").toUpperCase() as DayOfWeek

    // The same question guest booking asks before it takes a request, through
    // the same function - the two must never disagree about whether the
    // kitchen already has today's number.
    if (await isMealCountGenerated(now, mealTime)) {
      return Response.json({ error: "Already Generated" }, { status: 400 })
    }

    // Same order the booking form uses, so the count and the bookings can
    // never disagree about what is on offer.
    const { nonVegPriority } = await getMessConfig()

    // What today provides is the union of what each scheduled dish offers -
    // ticked by the prefect per dish, never guessed from the dish's name.
    const todayScheduleEntry = await prisma.mealScheduleEntry.findUnique({
      where: { dayOfWeek_mealTime: { dayOfWeek, mealTime } },
      include: {
        menuItems: { select: { menuItem: { select: { offers: true } } } },
      },
    })

    const scheduledDishes =
      todayScheduleEntry?.menuItems.map((mi) => mi.menuItem) ?? []

    // A slot with no menu at all is a configuration gap, not a veg day.
    // Offering everything keeps the count erring towards non-veg, which is
    // the safe direction, and the schedule screen flags the empty slot.
    const offers =
      scheduledDishes.length > 0
        ? resolveOffers(scheduledDishes, nonVegPriority)
        : resolveOffers([{ offers: [...nonVegPriority] }], nonVegPriority)

    const offeringBucket: MealBucket =
      (offers[0] as Exclude<MealBucket, "VEG"> | undefined) ?? "VEG"

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
            gte: guestDayStart,
            lte: guestDayEnd,
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

    const bucketCounts: Record<MealBucket, number> = {
      VEG: 0,
      MUTTON: 0,
      CHICKEN: 0,
      FISH: 0,
      EGG: 0,
    }
    const attendanceRecordsToCreate: {
      userId: string
      mealTime: "LUNCH" | "DINNER"
      date: Date
      mealId: string
    }[] = []

    for (const meal of allRegularMeals) {
      // Shared with the breakdown drill-down, so the card and the list it
      // links to can never disagree about where a boarder belongs.
      bucketCounts[assignBucket(meal, offers)]++

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
        bucketCounts.VEG += numMeals
      } else if (guestMeal.nonVegType === NonVegType.NONE) {
        // NON_VEG with no type is stale data: count it as the day's headline
        // rather than silently folding it into chicken.
        bucketCounts[offeringBucket] += numMeals
      } else {
        // Guests are counted by what they booked - mutton included, which
        // used to be added to the chicken total.
        bucketCounts[guestMeal.nonVegType] += numMeals
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
          totalVeg: bucketCounts.VEG,
          totalNonvegChicken: bucketCounts.CHICKEN,
          totalNonvegFish: bucketCounts.FISH,
          totalNonvegEgg: bucketCounts.EGG,
          totalNonvegMutton: bucketCounts.MUTTON,
          offeredTypes: offers,
          actualNonVegServed: offers[0] ?? null,
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

    // Attendance changed, so the cached board is stale. Best effort: a failed
    // invalidation only means the TTL decides instead.
    const { year, month } = istParts(now)
    await invalidate(cacheKeys.leaderboard(year, month))

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
