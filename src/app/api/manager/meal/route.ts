import { endOfDay, format, startOfDay } from "date-fns"

import {
  DayOfWeek,
  GuestMealStatusType,
  MealStatusType,
  MealType,
  NonVegType,
  UserRoleType,
  UserStatusType,
} from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"
import { getCurrentMealSlot } from "@/lib/utils"

import {
  calculateActualNonVegMeal,
  getNonVegTypeFromItemName,
  MealAttendanceToCreate,
} from "./_lib/utils"

export async function GET() {
  try {
    const session = await getSession()

    const user = session?.user
    if (!user?.id || !user.hostelId)
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
        hostelId: user.hostelId,
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

    if (!session?.user.hostelId) {
      return Response.json(
        { error: "Unauthorized - Hostel ID not found" },
        { status: 401 }
      )
    }

    if (session.user.role !== UserRoleType.MANAGER) {
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 }
      )
    }

    // Check for already generated meal activity
    const mealTime = getCurrentMealSlot()
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    const alreadyGenerated = await prisma.dailyMealActivity.findFirst({
      where: {
        mealTime,
        hostelId: session.user.hostelId,
        date: todayStart,
      },
    })

    if (alreadyGenerated) {
      return Response.json({ error: "Already Generated" }, { status: 400 })
    }

    // Fetch meal schedule for the current day and time
    const dayOfWeek = format(todayStart, "EEEE").toUpperCase() as DayOfWeek
    const entry = await prisma.mealScheduleEntry.findFirst({
      where: {
        hostelId: session.user.hostelId,
        dayOfWeek,
        mealTime,
      },
      include: {
        menuItems: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    if (!entry) {
      return Response.json(
        { error: "No meal schedule entry found" },
        { status: 400 }
      )
    }

    // Determine hostel’s non-veg offering for today
    const todayMenuItems = entry.menuItems.map((i) => i.menuItem.name)
    let hostelDailyOffering: NonVegType = NonVegType.NONE

    for (const itemName of todayMenuItems) {
      const nonVegType = getNonVegTypeFromItemName(itemName)
      if (nonVegType !== NonVegType.NONE) {
        hostelDailyOffering = nonVegType
        break
      }
    }

    // Fetch regular and guest meals
    const [allRegularMeals, allActiveGuestMeals] = await Promise.all([
      prisma.meal.findMany({
        where: {
          hostelId: session.user.hostelId,
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
          status: true,
          dislikedNonVegTypes: true,
          user: {
            select: {
              status: true,
            },
          },
        },
      }),
      prisma.guestMeal.findMany({
        where: {
          mealTime,
          hostelId: session.user.hostelId,
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

    // Initialize counters
    const attendanceRecordsToCreate: MealAttendanceToCreate[] = []
    let totalVeg = 0
    let totalNonvegChicken = 0
    let totalNonvegFish = 0
    let totalNonvegEgg = 0

    // Count meals by type for regular users
    for (const meal of allRegularMeals) {
      let actualNonVegServed: NonVegType = NonVegType.NONE

      if (meal.type === MealType.VEG) {
        totalVeg++
      } else {
        actualNonVegServed = calculateActualNonVegMeal(
          meal.nonVegType,
          meal.dislikedNonVegTypes as NonVegType[],
          hostelDailyOffering
        )

        switch (actualNonVegServed) {
          case NonVegType.CHICKEN:
            totalNonvegChicken++
            break
          case NonVegType.FISH:
            totalNonvegFish++
            break
          case NonVegType.EGG:
            totalNonvegEgg++
            break
          default:
            totalVeg++
            break
        }
      }

      attendanceRecordsToCreate.push({
        hostelId: session.user.hostelId,
        userId: meal.userId,
        mealTime,
        date: todayStart,
        mealId: meal.id,
      })
    }

    // Count guest meals by type
    let guestTotalMeals = 0
    let guestTotalVeg = 0
    let guestTotalNonvegChicken = 0
    let guestTotalNonvegFish = 0
    let guestTotalNonvegEgg = 0

    for (const guestMeal of allActiveGuestMeals) {
      const numMeals = guestMeal.numberOfMeals
      guestTotalMeals += numMeals

      if (guestMeal.type === MealType.VEG) {
        guestTotalVeg += numMeals
      } else {
        switch (guestMeal.nonVegType) {
          case NonVegType.CHICKEN:
            guestTotalNonvegChicken += numMeals
            break
          case NonVegType.FISH:
            guestTotalNonvegFish += numMeals
            break
          case NonVegType.EGG:
            guestTotalNonvegEgg += numMeals
            break
        }
      }
    }

    // Create meal activity and attendance records
    const totalMeal = allActiveGuestMeals.length + allRegularMeals.length

    const createdMealActivityPromise = prisma.dailyMealActivity.create({
      data: {
        mealTime,
        totalMeal,
        hostelId: session.user.hostelId,
        date: todayStart,
        actualNonVegServed: hostelDailyOffering,
        totalGuestMeal: guestTotalMeals,
        totalVeg: totalVeg + guestTotalVeg,
        totalNonvegChicken: totalNonvegChicken + guestTotalNonvegChicken,
        totalNonvegFish: totalNonvegFish + guestTotalNonvegFish,
        totalNonvegEgg: totalNonvegEgg + guestTotalNonvegEgg,
      },
    })

    const createMealAttendancePromise = prisma.mealAttendance.createMany({
      data: attendanceRecordsToCreate,
    })

    const [activityResult, attendanceResult] = await Promise.allSettled([
      createdMealActivityPromise,
      createMealAttendancePromise,
    ])

    if (activityResult.status === "fulfilled") {
      if (attendanceResult.status === "rejected") {
        console.warn("Attendance creation failed:", attendanceResult.reason)
      }
      return Response.json(activityResult.value, { status: 200 })
    } else {
      console.error("Meal activity creation failed:", activityResult.reason)
      return Response.json(
        { error: "Failed to create meal activity" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
