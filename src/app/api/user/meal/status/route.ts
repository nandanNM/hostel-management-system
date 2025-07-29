import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const data = await prisma.meal.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        status: true,
      },
    })
    console.log(data)
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
