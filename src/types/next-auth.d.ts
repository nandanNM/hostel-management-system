import { DefaultSession, DefaultUser } from "next-auth";
import { UserRoleType, UserStatusType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRoleType;
      onboardingCompleted: boolean;
      status: UserStatusType;
      hostelId?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRoleType;
    hostelId?: string | null;
    onboardingCompleted: boolean;
    status: UserStatusType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRoleType;
    hostelId?: string | null;
    onboardingCompleted: boolean;
    status: UserStatusType;
  }
}
