"use server"

import { redirect } from "next/navigation"

import getSession from "@/lib/get-session"

export default async function requireManager() {
  const session = await getSession()
  if (!session?.user) return redirect("/login")
  if (session.user.role !== "MANAGER") return redirect("/not-manager")
  return session
}
