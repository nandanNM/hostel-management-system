import { UserRoleType } from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    if (!session?.user.hostelId)
      return Response.json(
        { error: "Unauthorized - Hostel ID not found " },
        { status: 401 }
      )
    if (session.user.role !== UserRoleType.MANAGER)
      return Response.json(
        { error: "Unauthorized - You are not a manager" },
        { status: 401 }
      )
    const data = await prisma.meal.findMany({
      where: {
        hostelId: session.user.hostelId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })
    return Response.json(data)
  } catch (error) {
    console.log(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
