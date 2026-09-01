"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"

import { formatIST } from "@/lib/date"
import { GuestMealStatusType } from "@/lib/generated/prisma"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Badge } from "@/components/reui/badge"

import type { GuestMealHistoryRow } from "../_lib/actions"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

// History only ever contains these two statuses, but mapped as a partial
// record so a future status added upstream falls back to a neutral badge
// instead of breaking.
const STATUS_VARIANT: Partial<Record<GuestMealStatusType, BadgeVariant>> = {
  APPROVED: "info-light",
  SERVED: "success-light",
}

function prettify(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

export function getColumns(): ColumnDef<GuestMealHistoryRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Guest" />
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => formatIST(row.original.date, "dd/MM/yyyy"),
    },
    {
      accessorKey: "numberOfMeals",
      header: "Meals",
    },
    {
      accessorKey: "mealTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => prettify(row.original.mealTime),
    },
    {
      accessorKey: "mealCharge",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => `₹${row.original.mealCharge}`,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge
          variant={STATUS_VARIANT[row.original.status] ?? "secondary"}
          size="sm"
        >
          {prettify(row.original.status)}
        </Badge>
      ),
    },
  ]
}
