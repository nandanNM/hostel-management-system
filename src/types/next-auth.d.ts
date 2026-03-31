import { UserRoleType, UserStatusType } from "@prisma/client"
import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRoleType
      onboardingCompleted: boolean
      status: UserStatusType
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: UserRoleType
    onboardingCompleted: boolean
    status: UserStatusType
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRoleType
    onboardingCompleted: boolean
    status: UserStatusType
  }
}
