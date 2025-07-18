import { DefaultSession, DefaultUser } from "next-auth";
import { UserRoleType, UserStatusType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRoleType;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRoleType;

    onboardingCompleted: boolean;
    status: UserStatusType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRoleType;

    onboardingCompleted: boolean;
    status: UserStatusType;
  }
}
