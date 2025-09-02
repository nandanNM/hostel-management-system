import { endOfDay, startOfDay } from "date-fns"
import { formatInTimeZone, toZonedTime } from "date-fns-tz"

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
    const timeZone = "Asia/Kolkata"
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

    const now = new Date()
    const zonedDate = toZonedTime(now, timeZone)
    // Check for already generated meal activity
    const mealTime = getCurrentMealSlot()
    const todayStart = startOfDay(zonedDate)
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
    const dayOfWeek = formatInTimeZone(
      new Date(),
      timeZone,
      "EEEE"
    ).toUpperCase() as DayOfWeek
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

    // Determine what non-veg type the hostel is serving today
    const todayMenuItems = entry.menuItems.map((i) => i.menuItem.name)

    // const hostelDailyOffering: NonVegType = NonVegType.NONE
    let hostelDailyOffering: NonVegType = NonVegType.NONE

    for (const itemName of todayMenuItems) {
      const nonVegType = getNonVegTypeFromItemName(itemName)
      if (nonVegType !== NonVegType.NONE) {
        hostelDailyOffering = nonVegType
        break
      }
    }

    console.log(`Today's hostel offering: ${hostelDailyOffering}`)

    // Fetch regular meals and guest meals
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
              name: true, // For debugging
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
          name: true, // For debugging
        },
      }),
    ])

    // console.log(
    //   `Found ${allRegularMeals.length} regular meals, ${allActiveGuestMeals.length} guest meal entries`
    // )

    // Initialize counters for REGULAR meals (1 meal per user)
    const attendanceRecordsToCreate: MealAttendanceToCreate[] = []
    let regularVegCount = 0
    let regularNonvegChickenCount = 0
    let regularNonvegFishCount = 0
    let regularNonvegEggCount = 0

    // Process regular meals (each user = 1 meal)
    for (const meal of allRegularMeals) {
      let actualNonVegServed: NonVegType = NonVegType.NONE

      if (meal.type === MealType.VEG) {
        regularVegCount++
        //console.log(`Regular VEG meal for user: ${meal.user.name}`)
      } else {
        // Determine what this non-veg user actually gets based on preferences and hostel offering
        actualNonVegServed = calculateActualNonVegMeal(
          meal.nonVegType,
          meal.dislikedNonVegTypes as NonVegType[],
          hostelDailyOffering
        )

        // console.log(
        //   `User ${meal.user.name}: prefers ${meal.nonVegType}, hostel offers ${hostelDailyOffering}, gets ${actualNonVegServed}`
        // )

        switch (actualNonVegServed) {
          case NonVegType.CHICKEN:
            regularNonvegChickenCount++
            break
          case NonVegType.FISH:
            regularNonvegFishCount++
            break
          case NonVegType.EGG:
            regularNonvegEggCount++
            break
          case NonVegType.NONE:
          default:
            // If user can't get their preferred non-veg, they get veg
            regularVegCount++
            break
        }
      }

      // Create attendance record for this user
      attendanceRecordsToCreate.push({
        hostelId: session.user.hostelId,
        userId: meal.userId,
        mealTime,
        date: todayStart,
        mealId: meal.id,
      })
    }

    // Initialize counters for GUEST meals (multiple meals per entry)
    let guestTotalMeals = 0
    let guestVegCount = 0
    let guestNonvegChickenCount = 0
    let guestNonvegFishCount = 0
    let guestNonvegEggCount = 0

    // Process guest meals (each entry can have multiple meals)
    for (const guestMeal of allActiveGuestMeals) {
      const numMeals = guestMeal.numberOfMeals
      guestTotalMeals += numMeals

      // console.log(
      //   `Guest meal: ${guestMeal.name}, ${numMeals} meals, type: ${guestMeal.type}`
      // )

      if (guestMeal.type === MealType.VEG) {
        guestVegCount += numMeals
      } else {
        // Guest meals have specific non-veg type preference
        switch (guestMeal.nonVegType) {
          case NonVegType.CHICKEN:
            guestNonvegChickenCount += numMeals
            break
          case NonVegType.FISH:
            guestNonvegFishCount += numMeals
            break
          case NonVegType.EGG:
            guestNonvegEggCount += numMeals
            break
          default:
            guestVegCount += numMeals
            break
        }
      }
    }

    // Calculate final totals
    const totalMeals = allRegularMeals.length + guestTotalMeals // regular users + guest meal count
    const finalVegCount = regularVegCount + guestVegCount
    const finalChickenCount =
      regularNonvegChickenCount + guestNonvegChickenCount
    const finalFishCount = regularNonvegFishCount + guestNonvegFishCount
    const finalEggCount = regularNonvegEggCount + guestNonvegEggCount

    //console.log(`Final counts:`)
    //console.log(`- Total meals: ${totalMeals}`)
    // console.log(
    //   `- VEG: ${finalVegCount} (Regular: ${regularVegCount} + Guest: ${guestVegCount})`
    // )
    // console.log(
    //   `- CHICKEN: ${finalChickenCount} (Regular: ${regularNonvegChickenCount} + Guest: ${guestNonvegChickenCount})`
    // )
    // console.log(
    //   `- FISH: ${finalFishCount} (Regular: ${regularNonvegFishCount} + Guest: ${guestNonvegFishCount})`
    // )
    // console.log(
    //   `- EGG: ${finalEggCount} (Regular: ${regularNonvegEggCount} + Guest: ${guestNonvegEggCount})`
    // )

    // Validation: Total should match
    const calculatedTotal =
      finalVegCount + finalChickenCount + finalFishCount + finalEggCount
    if (calculatedTotal !== totalMeals) {
      console.error(
        `Meal count mismatch! Total: ${totalMeals}, Calculated: ${calculatedTotal}`
      )
      return Response.json(
        {
          error: `Meal count validation failed. Expected ${totalMeals}, got ${calculatedTotal}`,
        },
        { status: 500 }
      )
    }

    // Create meal activity and attendance records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create daily meal activity
      const mealActivity = await tx.dailyMealActivity.create({
        data: {
          mealTime,
          totalMeal: totalMeals,
          hostelId: session.user.hostelId!,
          date: todayStart,
          actualNonVegServed: hostelDailyOffering,
          totalGuestMeal: guestTotalMeals,
          totalVeg: finalVegCount,
          totalNonvegChicken: finalChickenCount,
          totalNonvegFish: finalFishCount,
          totalNonvegEgg: finalEggCount,
        },
      })

      // Create attendance records if any
      if (attendanceRecordsToCreate.length > 0) {
        await tx.mealAttendance.createMany({
          data: attendanceRecordsToCreate,
        })
      }

      return mealActivity
    })

    //console.log(`Successfully created meal activity with ID: ${result.id}`)

    return Response.json(result, { status: 200 })
  } catch (error) {
    console.error("POST /daily-meal-activity error:", error)
    return Response.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
