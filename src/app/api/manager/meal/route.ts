import { MealStatusType, MealType, NonVegType } from "@/generated/prisma";
import getSession from "@/lib/get-session";
import prisma from "@/lib/prisma";
import { getTimeOfDay } from "@/lib/utils";
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
    const mealTime = getTimeOfDay();
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
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "MANAGER")
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 },
      );
    const mealTime = getTimeOfDay();
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const alreadyGenerated = await prisma.dailyMealActivity.findFirst({
      where: {
        mealTime: mealTime,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
    if (alreadyGenerated) {
      return Response.json({ error: "Already Generated" }, { status: 400 });
    }
    const [allActiveRegularMeals, allActiveGuestMeals] = await Promise.all([
      prisma.meal.findMany({
        where: {
          status: MealStatusType.ACTIVE,
        },
        select: {
          id: true,
          type: true,
          nonVegType: true,
        },
      }),
      prisma.guestMeal.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          mealTime: mealTime,
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
          case NonVegType.NONE:
            break;
        }
      }
    }
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
          case NonVegType.NONE:
            break;
        }
      }
    }
    console.log({
      totalVeg,
      totalNonvegChicken,
      totalNonvegFish,
      totalNonvegEgg,
      guestTotalMeals,
      guestTotalVeg,
      guestTotalNonvegChicken,
      guestTotalNonvegFish,
      guestTotalNonvegEgg,
    });
    const totalMeal =
      allActiveGuestMeals.length + allActiveRegularMeals.length || 0;
    const data = await prisma.dailyMealActivity.create({
      data: {
        mealTime: mealTime,
        totalMeal: totalMeal,
        totalGuestMeal: guestTotalMeals,
        totalVeg: guestTotalVeg + totalVeg,
        totalNonvegChicken: guestTotalNonvegChicken + totalNonvegChicken,
        totalNonvegFish: guestTotalNonvegFish + totalNonvegFish,
        totalNonvegEgg: guestTotalNonvegEgg + totalNonvegEgg,
      },
    });

    return Response.json(data);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
