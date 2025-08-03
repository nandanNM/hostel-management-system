import { redirect } from "next/navigation"
import { Session } from "next-auth"

import { UserStatusType } from "@/lib/generated/prisma"

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
