"use server"

import { signOut } from "@/auth"

/**
 * Sign out and land on the login screen.
 *
 * A boarder who signed in with the wrong Google account had no way out of the
 * restricted screens: every route bounced them back, and the session cookie
 * kept them on the same account.
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
