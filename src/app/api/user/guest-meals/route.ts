import { GuestMealStatusType } from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const data = await prisma.guestMeal.findMany({
      where: {
        userId: session.user.id,
        status: GuestMealStatusType.PENDING,
      },
    })
    return Response.json(data)
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
