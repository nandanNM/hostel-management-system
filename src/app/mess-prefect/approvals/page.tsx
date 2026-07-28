import { unstable_noStore as noStore } from "next/cache"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { UserCheck } from "@phosphor-icons/react/ssr"

import { UserStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

import { ApprovalsTable } from "./_components/approvals-table"

export default async function ApprovalsPage() {
  noStore()
  await requireMessPrefect()

  const users = await prisma.user.findMany({
    where: { status: UserStatusType.INACTIVE, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      selfPhNo: true,
      roomNo: true,
      onboardingCompleted: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-3">
        <UserCheck className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground mt-1">
            {users.length} user{users.length === 1 ? "" : "s"} waiting to be
            activated.
          </p>
        </div>
      </div>

      <ApprovalsTable users={users} />
    </div>
  )
}
