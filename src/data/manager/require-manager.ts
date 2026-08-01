"use server"

import { redirect } from "next/navigation"

import { canManage } from "@/lib/authz"
import { UserStatusType } from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"

export default async function requireManager() {
  const session = await getSession()
  if (!session?.user) return redirect("/login")
  // MessPrefect inherits all Manager capabilities, so it passes this guard too.
  if (!canManage(session.user.role)) return redirect("/not-manager")
  if (session.user.status === UserStatusType.SUSPENDED)
    redirect("/not-user/suspended")
  return session
}
