import { db } from "@/db";
import { meal } from "@/db/schemas";
import { requireUser } from "@/lib/require-user";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await requireUser();

    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const data = await db.query.meal.findFirst({
      where: eq(meal.userId, session.user.id),
      columns: {
        isActive: true,
      },
    });
    return Response.json(data);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
