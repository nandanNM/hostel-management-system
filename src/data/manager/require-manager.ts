"use server";
import getSession from "@/lib/getSession";
import { redirect } from "next/navigation";

export default async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) return redirect("/login");
  if (session.user.role !== "admin") return redirect("/not-manager");
  return session;
}
