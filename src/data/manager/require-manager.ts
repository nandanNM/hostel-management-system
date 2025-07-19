"use server";
import getSession from "@/lib/get-session";
import { redirect } from "next/navigation";

export default async function requireManager() {
  const session = await getSession();
  if (!session?.user) return redirect("/login");
  if (session.user.role !== "MANAGER") return redirect("/not-manager");
  return session;
}
