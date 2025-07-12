import { redirect } from "next/navigation";
import getSession from "./get-session";
import { Session } from "next-auth";

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session?.user.id) redirect("/login");
  return session;
}
