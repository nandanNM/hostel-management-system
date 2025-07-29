import { redirect } from "next/navigation"
import { Session } from "next-auth"

import getSession from "./get-session"

export async function requireUser(): Promise<Session> {
  const session = await getSession()
  if (!session?.user.id) redirect("/login")
  return session
}
