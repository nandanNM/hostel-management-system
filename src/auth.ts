import { cookies } from "next/headers"
import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import { Adapter } from "next-auth/adapters"
import Google from "next-auth/providers/google"

import { UserRoleType } from "./lib/generated/prisma"
import { inviteMatchesAccount, verifyInviteToken } from "./lib/invitations"
import prisma from "./lib/prisma"

/** Set by /invite/[token]; read once here and then cleared. */
export const INVITE_COOKIE = "mess_invite"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    /**
     * Tag an invited guest as a temporary boarder.
     *
     * The invite is a signed token in a short-lived cookie, set by
     * /invite/[token]. It only applies when the signed email matches the
     * account that actually signed in - otherwise a forwarded link would hand
     * out boarder accounts - and only to a STUDENT, so it can never demote a
     * manager or prefect.
     */
    async signIn({ user }) {
      try {
        const jar = await cookies()
        const token = jar.get(INVITE_COOKIE)?.value
        if (!token || !user?.id) return true

        const verdict = verifyInviteToken(token, process.env.AUTH_SECRET ?? "")
        if (!verdict.valid || !verdict.payload.temporary) return true
        if (!inviteMatchesAccount(verdict.payload, user.email)) return true

        await prisma.user.updateMany({
          where: { id: user.id, role: UserRoleType.STUDENT },
          data: { role: UserRoleType.TEMPORARY_BOARDER },
        })

        jar.delete(INVITE_COOKIE)
      } catch (error) {
        // A failed tagging must not block the sign-in itself.
        console.error("[auth] invite tagging failed:", error)
      }

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.onboardingCompleted = user.onboardingCompleted
        token.status = user.status
        token.id = user.id
      }

      return token
    },
    async session({ session, user, token }) {
      if (user) {
        session.user.id = user.id
        session.user.role = user.role
        session.user.onboardingCompleted = user.onboardingCompleted
        session.user.status = user.status
      } else if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
        session.user.status = token.status
        session.user.id = token.id as string
      }
      return session
    },
  },

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
})
