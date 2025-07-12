import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { Adapter } from "next-auth/adapters";
import { account, session, user, verificationTokens } from "@/db/schemas";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  providers: [Google],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isBoader = user.isBoader;
        token.onboarding = user.onboarding;
      }
      return token;
    },
    session({ session, user }) {
      if (user) {
        session.user.role = user.role;
        session.user.isBoader = user.isBoader;
        session.user.onboarding = user.onboarding;
      }
      return session;
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
});
