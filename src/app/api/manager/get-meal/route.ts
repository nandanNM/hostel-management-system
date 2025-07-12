import { db } from "@/db";
import { dailyMealActivity } from "@/db/schemas";
import getSession from "@/lib/get-session";
import { getTimeOfDay } from "@/lib/utils";
import { endOfDay, startOfDay } from "date-fns";
import { and, between, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "manager")
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 },
      );
    const timeOfDay = getTimeOfDay();
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();
    const data = await db.query.dailyMealActivity.findFirst({
      where: and(
        eq(dailyMealActivity.mealTime, timeOfDay),
        between(dailyMealActivity.createdAt, todayStart, todayEnd),
      ),
    });

    return Response.json(data);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
