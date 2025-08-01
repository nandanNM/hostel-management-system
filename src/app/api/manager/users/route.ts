import { UserRoleType, UserStatusType } from "@/generated/prisma"

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
    const users = await prisma.user.findMany({
      where: {
        hostelId: session.user.hostelId,
        NOT: {
          status: {
            in: [
              UserStatusType.PENDING_ONBOARDING,
              UserStatusType.FORMA,
              UserStatusType.INACTIVE,
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        meals: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    })

    return Response.json(users)
  } catch (error) {
    console.log(error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
