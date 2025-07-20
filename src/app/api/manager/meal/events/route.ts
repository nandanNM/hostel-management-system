import prisma from "@/lib/prisma";
import { getCurrentMealSlot } from "@/lib/utils";
import { endOfDay, startOfDay } from "date-fns";

export async function GET() {
  try {
    const mealTime = getCurrentMealSlot();
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const data = await prisma.userMealEvent.findFirst({
      where: {
        mealTime: mealTime,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json(data);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
