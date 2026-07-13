"use server"

import { redirect } from "next/navigation"

import { UserRoleType, UserStatusType } from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"

export default async function requireMessPrefect() {
  const session = await getSession()
  if (!session?.user) return redirect("/login")
  if (session.user.role !== UserRoleType.MESS_PREFECT)
    return redirect("/not-mess-prefect")
  if (session.user.status === UserStatusType.SUSPENDED)
    redirect("/not-user/suspended")
  return session
}
