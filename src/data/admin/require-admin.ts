"use server"

import { redirect } from "next/navigation"

import getSession from "@/lib/get-session"

export default async function requireAdmin() {
  const session = await getSession()
  if (!session?.user) return redirect("/login")
  if (session.user.role !== "ADMIN") return redirect("/not-admin")
  return session
}
