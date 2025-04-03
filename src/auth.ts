import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { Adapter } from "next-auth/adapters";
import { account, session, user } from "@/db/schema";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session,
  }) as Adapter,
  providers: [Google],
  callbacks: {
    session({ session, user }) {
      if (user) session.user.role = user.role;
      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },
});
