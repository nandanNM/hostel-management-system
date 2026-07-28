import getSession from "@/lib/get-session"
import { getMealPreferenceLock } from "@/lib/meal-lock"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const [data, lock] = await Promise.all([
      prisma.meal.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          status: true,
        },
      }),
      getMealPreferenceLock(),
    ])

    return Response.json({ status: data?.status ?? null, ...lock })
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
