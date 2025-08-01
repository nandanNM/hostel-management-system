import { redirect } from "next/navigation"
import { UserStatusType } from "@/generated/prisma"
import { Session } from "next-auth"

import getSession from "./get-session"

export async function requireUser(): Promise<Session> {
  const session = await getSession()
  if (!session?.user.id) redirect("/login")
  if (!session.user.onboardingCompleted) redirect("/onboarding/identity")
  if (session.user.status === UserStatusType.SUSPENDED)
    redirect("/not-user/suspended")
  if (session.user.status === UserStatusType.INACTIVE)
    redirect("/not-user/inactive")
  return session
}
