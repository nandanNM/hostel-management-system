import { UserRoleType } from "@/lib/generated/prisma"

// Roles the Mess Prefect may assign from the Managers screen (all roles except
// the default Student). Includes MESS_PREFECT so a prefect can appoint another.
export const ASSIGNABLE_ROLES = [
  UserRoleType.STAFF,
  UserRoleType.MANAGER,
  UserRoleType.MESS_PREFECT,
] as const

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]
