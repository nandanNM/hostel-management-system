import { UserRoleType } from "@/lib/generated/prisma"

// Roles the Mess Prefect may assign from the Change Roles screen. Includes STUDENT
// so a manager can be stepped back down, and MESS_PREFECT so a prefect can
// appoint another.
export const ASSIGNABLE_ROLES = [
  UserRoleType.STUDENT,
  UserRoleType.STAFF,
  UserRoleType.MANAGER,
  UserRoleType.MESS_PREFECT,
] as const

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]
