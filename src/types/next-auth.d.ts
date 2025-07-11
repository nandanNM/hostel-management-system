import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    isBoader?: boolean;
    onboarding?: boolean;
  }
  interface Session {
    user: User & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    isBoader?: boolean;
    onboarding?: boolean;
  }
}
