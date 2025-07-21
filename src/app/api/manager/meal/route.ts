import {
  MealStatusType,
  MealType,
  NonVegType,
  UserStatusType,
} from "@/generated/prisma";
import getSession from "@/lib/get-session";
import prisma from "@/lib/prisma";
import { getCurrentMealSlot } from "@/lib/utils";
import { endOfDay, startOfDay } from "date-fns";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "MANAGER")
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 },
      );
    const mealTime = getCurrentMealSlot();
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const data = await prisma.dailyMealActivity.findFirst({
      where: {
        mealTime: mealTime,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    return Response.json(data);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export async function POST() {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MANAGER") {
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 },
      );
    }

    const mealTime = getCurrentMealSlot();
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Check if the meal activity has already been generated today
    const alreadyGenerated = await prisma.dailyMealActivity.findFirst({
      where: {
        mealTime,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (alreadyGenerated) {
      return Response.json({ error: "Already Generated" }, { status: 400 });
    }

    // Fetch all regular meals and today's active guest meals
    const [allRegularMeals, allActiveGuestMeals] = await Promise.all([
      prisma.meal.findMany({
        select: {
          id: true,
          userId: true,
          type: true,
          nonVegType: true,
          status: true,
          user: {
            select: {
              status: true,
            },
          },
        },
      }),
      prisma.guestMeal.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          mealTime,
          status: MealStatusType.ACTIVE,
        },
        select: {
          id: true,
          numberOfMeals: true,
          type: true,
          nonVegType: true,
        },
      }),
    ]);

    // Filter only active meals where both meal and user are active
    const allActiveRegularMeals = allRegularMeals.filter(
      (meal) =>
        meal.status === MealStatusType.ACTIVE &&
        meal.user.status === UserStatusType.ACTIVE,
    );

    // Active users (whether meal status active or not), for attendance
    const activeUsers = allRegularMeals.filter(
      (meal) => meal.user.status === UserStatusType.ACTIVE,
    );

    // Count meals by type for regular users
    let totalVeg = 0;
    let totalNonvegChicken = 0;
    let totalNonvegFish = 0;
    let totalNonvegEgg = 0;

    for (const meal of allActiveRegularMeals) {
      if (meal.type === MealType.VEG) {
        totalVeg++;
      } else if (meal.type === MealType.NON_VEG) {
        switch (meal.nonVegType) {
          case NonVegType.CHICKEN:
            totalNonvegChicken++;
            break;
          case NonVegType.FISH:
            totalNonvegFish++;
            break;
          case NonVegType.EGG:
            totalNonvegEgg++;
            break;
        }
      }
    }

    // Count meals by type for guest meals
    let guestTotalMeals = 0;
    let guestTotalVeg = 0;
    let guestTotalNonvegChicken = 0;
    let guestTotalNonvegFish = 0;
    let guestTotalNonvegEgg = 0;

    for (const guestMeal of allActiveGuestMeals) {
      const numMeals = guestMeal.numberOfMeals;
      guestTotalMeals += numMeals;

      if (guestMeal.type === MealType.VEG) {
        guestTotalVeg += numMeals;
      } else if (guestMeal.type === MealType.NON_VEG) {
        switch (guestMeal.nonVegType) {
          case NonVegType.CHICKEN:
            guestTotalNonvegChicken += numMeals;
            break;
          case NonVegType.FISH:
            guestTotalNonvegFish += numMeals;
            break;
          case NonVegType.EGG:
            guestTotalNonvegEgg += numMeals;
            break;
        }
      }
    }

    // Total meals includes both regular and guest entries
    const totalMeal = allActiveGuestMeals.length + allActiveRegularMeals.length;

    // Create attendance records for active users
    const attendanceRecordsToCreate = activeUsers.map((meal) => ({
      userId: meal.userId,
      mealTime,
      date: todayStart,
      isPresent: meal.status === MealStatusType.ACTIVE ? true : false, // Already filtered for active users
      mealId: meal.id,
    }));

    // Create meal activity record and attendance records in parallel
    const [mealActivity] = await Promise.all([
      prisma.dailyMealActivity.create({
        data: {
          mealTime,
          totalMeal,
          totalGuestMeal: guestTotalMeals,
          totalVeg: totalVeg + guestTotalVeg,
          totalNonvegChicken: totalNonvegChicken + guestTotalNonvegChicken,
          totalNonvegFish: totalNonvegFish + guestTotalNonvegFish,
          totalNonvegEgg: totalNonvegEgg + guestTotalNonvegEgg,
        },
      }),
      prisma.mealAttendance.createMany({
        data: attendanceRecordsToCreate,
      }),
    ]);
    return Response.json(mealActivity);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
