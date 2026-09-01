"use client"

import { ColumnDef } from "@tanstack/react-table"

import { formatIST } from "@/lib/date"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"

import type { GuestMealHistoryRow } from "../_lib/actions"

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
        <Badge variant="secondary">{prettify(row.original.status)}</Badge>
      ),
    },
  ]
}
