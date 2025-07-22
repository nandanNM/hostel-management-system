import { UserRoleType } from "@/generated/prisma";
import getSession from "@/lib/get-session";
import prisma from "@/lib/prisma";
import { endOfMonth, parseISO, startOfMonth } from "date-fns";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date") ?? undefined;
    if (!date) return Response.json({ error: "Missing date" }, { status: 400 });
    const session = await getSession();
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== UserRoleType.MANAGER)
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 },
      );
    const parsedDate = parseISO(date); // safely parse "YYYY-MM-DD"
    const monthStart = startOfMonth(parsedDate);
    const monthEnd = endOfMonth(parsedDate);
    const data = await prisma.mealAttendance.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json(data);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
