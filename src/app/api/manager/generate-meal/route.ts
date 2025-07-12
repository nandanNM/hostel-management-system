import { db } from "@/db";
import { dailyMealActivity, guestmeal, meal } from "@/db/schemas";
import getSession from "@/lib/get-session";
import { getTimeOfDay } from "@/lib/utils";
import { endOfDay, startOfDay } from "date-fns";
import { and, between, eq } from "drizzle-orm";
import { NonVegType } from "@/constants/form.constants";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user.id || !session?.user.role)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "manager")
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 },
      );

    const timeOfDay = getTimeOfDay();
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();

    const alreadyGenerated = await db.query.dailyMealActivity.findFirst({
      where: and(
        eq(dailyMealActivity.mealTime, timeOfDay),
        between(dailyMealActivity.createdAt, todayStart, todayEnd),
      ),
    });
    if (alreadyGenerated) {
      return Response.json({ error: "Already Generated" }, { status: 400 });
    }

    const [activeUserMeals, activeGuestMeals] = await Promise.all([
      await db
        .select({
          mealType: meal.mealType,
          nonVegType: meal.nonVegType,
          userId: meal.userId,
          massage: meal.massage,
        })
        .from(meal)
        .where(eq(meal.isActive, true)),
      await db
        .select({
          mealType: guestmeal.mealType,
          nonVegType: guestmeal.nonVegType,
          numberOfMeals: guestmeal.numberOfMeals,
          massage: guestmeal.massage,
        })
        .from(guestmeal)
        .where(
          and(
            eq(guestmeal.status, "accepted"),
            between(guestmeal.date, todayStart, todayEnd),
          ),
        ),
    ]);

    const groupedUserMeals = {
      totalUserIds: new Set<string>(),
      massages: new Set<string>(),
      veg: 0,
      "non-veg": {
        chicken: 0,
        fish: 0,
        egg: 0,
        none: 0,
      },
      totalGuestMeals: 0,
    };
    // clasic java script loop
    for (const m of activeUserMeals) {
      groupedUserMeals.totalUserIds.add(m.userId);
      if (m.massage && m.massage.length >= 6)
        groupedUserMeals.massages.add(m.massage);
      if (m.mealType === "veg") {
        groupedUserMeals.veg += 1;
      } else if (m.mealType === "non-veg" && m.nonVegType) {
        const type = m.nonVegType as NonVegType;
        groupedUserMeals["non-veg"][type] += 1;
      }
    }

    for (const g of activeGuestMeals) {
      if (g.massage && g.massage.length >= 6)
        groupedUserMeals.massages.add(g.massage);
      const count = g.numberOfMeals ?? 1;
      groupedUserMeals.totalGuestMeals += count;
      if (g.mealType === "veg") {
        groupedUserMeals.veg += count;
      } else if (g.mealType === "non-veg" && g.nonVegType) {
        const type = g.nonVegType as NonVegType;
        groupedUserMeals["non-veg"][type] += count;
      }
    }

    const data = await db
      .insert(dailyMealActivity)
      .values({
        mealTime: timeOfDay,
        presentUserIds: Array.from(groupedUserMeals.totalUserIds),
        totalVeg: groupedUserMeals.veg,
        totalNonvegChicken: groupedUserMeals["non-veg"].chicken,
        totalNonvegFish: groupedUserMeals["non-veg"].fish,
        totalNonvegEgg: groupedUserMeals["non-veg"].egg,
        totalGuestMeals: groupedUserMeals.totalGuestMeals,
        massages: Array.from(groupedUserMeals.massages),
      })
      .returning();

    return Response.json(data);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
