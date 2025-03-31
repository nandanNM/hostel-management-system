"use server";

import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export const getServerSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
};
