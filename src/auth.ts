import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import { Adapter } from "next-auth/adapters"
import Google from "next-auth/providers/google"

import prisma from "./lib/prisma"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.hostelId = user.hostelId
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
        session.user.hostelId = user.hostelId
        session.user.onboardingCompleted = user.onboardingCompleted
        session.user.status = user.status
      } else if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role
        session.user.hostelId = token.hostelId as string
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
