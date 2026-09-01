"use client"

import { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import UserAvatar from "@/components/UserAvatar"

import type { MealBreakdownUser } from "../../_lib/meal-breakdown"

export function getColumns(): ColumnDef<MealBreakdownUser>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <UserAvatar size={32} avatarUrl={user.image} />
            <span className="font-medium">{user.name ?? "Unnamed"}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "roomNo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Room" />
      ),
      cell: ({ row }) => row.original.roomNo ?? "—",
    },
  ]
}
