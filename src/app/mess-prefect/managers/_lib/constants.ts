import { UserRoleType } from "@/lib/generated/prisma"

// Roles the Mess Prefect may assign from the Managers screen. MESS_PREFECT is
// intentionally excluded so the role can only be granted out-of-band (no
// in-app privilege escalation to prefect).
export const ASSIGNABLE_ROLES = [
  UserRoleType.STUDENT,
  UserRoleType.STAFF,
  UserRoleType.MANAGER,
] as const

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]
