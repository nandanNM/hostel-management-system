"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import UserAvatar from "@/components/UserAvatar"

import type { MonthlyMealRow } from "../_lib/aggregate"

function NumberCell({ value }: { value: number }) {
  return (
    <span
      className={
        value === 0 ? "text-muted-foreground tabular-nums" : "tabular-nums"
      }
    >
      {value}
    </span>
  )
}

export function getMonthlyMealColumns(): ColumnDef<MonthlyMealRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Boarder" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserAvatar size={28} avatarUrl={row.original.image} />
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "roomNo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Room" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.roomNo ?? "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.status.toLowerCase()}
        </Badge>
      ),
      filterFn: (row, id, value) =>
        Array.isArray(value) && value.includes(row.getValue(id)),
    },
    {
      accessorKey: "lunch",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lunch" />
      ),
      cell: ({ row }) => <NumberCell value={row.original.lunch} />,
    },
    {
      accessorKey: "dinner",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dinner" />
      ),
      cell: ({ row }) => <NumberCell value={row.original.dinner} />,
    },
    {
      accessorKey: "guest",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Guest" />
      ),
      cell: ({ row }) => <NumberCell value={row.original.guest} />,
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">{row.original.total}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button asChild size="sm" variant="ghost">
          <Link href={`/manager/users/${row.original.userId}/meals`}>View</Link>
        </Button>
      ),
    },
  ]
}
