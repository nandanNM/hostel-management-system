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

/**
 * True only for a plain Manager. Operational write actions — generating the
 * daily meal count and approving/rejecting guest meals — are Manager-only;
 * MessPrefect has read/oversight access to these but cannot perform them.
 */
export function isManager(role: UserRoleType | null | undefined): boolean {
  return role === UserRoleType.MANAGER
}
