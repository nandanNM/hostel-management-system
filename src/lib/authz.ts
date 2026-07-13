import { UserRoleType } from "@/lib/generated/prisma"

/**
 * Roles that have manager-level access. MessPrefect inherits every Manager
 * capability, so it passes all manager guards and API checks.
 */
export const MANAGER_ROLES: UserRoleType[] = [
  UserRoleType.MANAGER,
  UserRoleType.MESS_PREFECT,
]

/** True when the role may use manager features (Manager or MessPrefect). */
export function canManage(role: UserRoleType | null | undefined): boolean {
  return role != null && MANAGER_ROLES.includes(role)
}
