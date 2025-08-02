import {
  DayOfWeek,
  GuestMealStatusType,
  MealStatusType,
  MealType,
  NonVegType,
  UserRoleType,
  UserStatusType,
} from "@/generated/prisma"
import { endOfDay, format, startOfDay } from "date-fns"

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
    if (!session?.user.hostelId)
      return Response.json(
        { error: "Unauthorized - Hostel ID not found " },
        { status: 401 }
      )

    if (session.user.role !== UserRoleType.MANAGER) {
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 }
      )
    }

    const mealTime = getCurrentMealSlot()
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    // Check if the meal activity has already been generated today
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
    const todayMenuItems = entry.menuItems.map((i) => i.menuItem.name)
    let hostelDailyOffering: NonVegType = NonVegType.NONE
    for (const itemName of todayMenuItems) {
      const nonVegType = getNonVegTypeFromItemName(itemName)
      if (nonVegType !== NonVegType.NONE) {
        hostelDailyOffering = nonVegType
        break
      }
    }
    // Fetch all regular meals and today's active guest meals
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

    // Count meals by type for regular users
    const attendanceRecordsToCreate: MealAttendanceToCreate[] = []
    let totalVeg = 0
    let totalNonvegChicken = 0
    let totalNonvegFish = 0
    let totalNonvegEgg = 0

    for (const meal of allRegularMeals) {
      let actualNonVegServed: NonVegType = NonVegType.NONE

      if (meal.type === MealType.VEG) {
        totalVeg++
        actualNonVegServed = NonVegType.NONE
      } else {
        // meal.type === MealType.NON_VEG
        // Apply the new calculation logic to determine what the user actually gets
        actualNonVegServed = calculateActualNonVegMeal(
          meal.nonVegType,
          meal.dislikedNonVegTypes as NonVegType[], // Cast to the correct array type
          hostelDailyOffering
        )

        // Increment the correct counter based on the calculated actual meal
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
          case NonVegType.NONE:
          default:
            totalVeg++ // If they end up with a vegetarian meal
            break
        }
      }

      // Add the attendance record with the calculated actualNonVegServed
      attendanceRecordsToCreate.push({
        hostelId: session.user.hostelId as string,
        userId: meal.userId,
        mealTime,
        date: todayStart,
        mealId: meal.id,
      })
    }

    // Count meals by type for guest meals
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
      } else if (guestMeal.type === MealType.NON_VEG) {
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

    // Total meals includes both regular and guest entries
    const totalMeal = allActiveGuestMeals.length + allRegularMeals.length

    // Create attendance records for active users

    // Create meal activity record and attendance records in parallel
    const hostelId = session.user.hostelId
    const createdMealActivityPromise = prisma.dailyMealActivity.create({
      data: {
        mealTime,
        totalMeal,
        hostelId,
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

    const [createdMealActivity] = await Promise.all([
      createdMealActivityPromise,
      createMealAttendancePromise,
    ])

    return Response.json(createdMealActivity)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
