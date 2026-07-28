import { unstable_noStore as noStore } from "next/cache"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { UserGear as UserCog } from "@phosphor-icons/react/ssr"

import { UserRoleType, UserStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

import { ManagersTable } from "./_components/managers-table"

export default async function ManagersPage() {
  noStore()
  const session = await requireMessPrefect()

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      NOT: { status: { in: [UserStatusType.INACTIVE, UserStatusType.FORMA] } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      selfPhNo: true,
      roomNo: true,
    },
    // Managers / prefects first, then the rest, alphabetically.
    orderBy: [{ role: "asc" }, { name: "asc" }],
  })

  const managerCount = users.filter(
    (u) => u.role === UserRoleType.MANAGER
  ).length

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <UserCog className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Managers</h1>
          <p className="text-muted-foreground mt-1">
            Assign managers and manage user details. Currently {managerCount}{" "}
            active manager{managerCount === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <ManagersTable users={users} currentUserId={session.user.id ?? ""} />
    </div>
  )
}
