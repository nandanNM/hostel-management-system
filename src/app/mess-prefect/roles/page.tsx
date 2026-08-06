import React from "react"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { SearchParams } from "@/types"
import { UserGear as UserCog } from "@phosphor-icons/react/ssr"

import { UserRoleType, UserStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"

import { RolesTable } from "./_components/roles-table"
import { getUsersForRoles } from "./_lib/actions"
import { searchParamsSchema } from "./_lib/validations"

export interface RolesPageProps {
  searchParams: Promise<SearchParams>
}

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const resolvedSearchParams = await searchParams
  const search = searchParamsSchema.parse(resolvedSearchParams)

  const session = await requireMessPrefect()
  const usersPromise = getUsersForRoles(search)
  const managerCount = await prisma.user.count({
    where: {
      role: UserRoleType.MANAGER,
      deletedAt: null,
      NOT: { status: { in: [UserStatusType.INACTIVE, UserStatusType.FORMA] } },
    },
  })

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <UserCog className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Change Roles</h1>
          <p className="text-muted-foreground mt-1">
            Assign manager/mess-prefect roles and manage user details. Currently{" "}
            {managerCount} active manager
            {managerCount === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={6}
            searchableColumnCount={1}
            filterableColumnCount={2}
            cellWidths={["16rem", "8rem", "10rem", "8rem", "8rem", "10rem"]}
            shrinkZero
          />
        }
      >
        <RolesTable
          usersPromise={usersPromise}
          currentUserId={session.user.id ?? ""}
        />
      </React.Suspense>
    </div>
  )
}
