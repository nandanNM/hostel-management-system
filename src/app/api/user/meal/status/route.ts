import getSession from "@/lib/get-session"
import { getMealStatusForUser } from "@/app/(root)/dashboard/_lib/meal-status"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 })

    const result = await getMealStatusForUser(session.user.id)

    return Response.json(result)
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
