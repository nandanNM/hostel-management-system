"use client"

import * as React from "react"
import { Leaf, ForkKnife as UtensilsCrossed } from "@phosphor-icons/react"
import { ColumnDef } from "@tanstack/react-table"

import { formatIST } from "@/lib/date"
import { GuestMealStatusType } from "@/lib/generated/prisma"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Badge } from "@/components/reui/badge"
import UserAvatar from "@/components/UserAvatar"

import type { GuestMealLogRow } from "../_lib/actions"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

// Preserves this screen's pre-existing color convention (green=approved,
// blue=served), distinct from the boarder-facing history page's own mapping.
const STATUS_VARIANT: Record<GuestMealStatusType, BadgeVariant> = {
  PENDING: "warning-light",
  APPROVED: "success-light",
  REJECTED: "destructive-light",
  CANCELLED: "secondary",
  SERVED: "info-light",
}

function prettify(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

export function getColumns(): ColumnDef<GuestMealLogRow>[] {
  return [
    {
      accessorKey: "requestedBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Requested By" />
      ),
      cell: ({ row }) => {
        const user = row.original.user
        return (
          <div className="flex items-center gap-3">
            <UserAvatar size={32} avatarUrl={user?.image} />
            <div>
              <div className="font-medium">{user?.name ?? "Unknown"}</div>
              <div className="text-muted-foreground text-xs">{user?.email}</div>
            </div>
          </div>
        )
      },
    },
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
      cell: ({ row }) => formatIST(row.original.date, "dd MMM yyyy"),
    },
    {
      accessorKey: "mealTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Meal Time" />
      ),
      cell: ({ row }) => prettify(row.original.mealTime),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const meal = row.original
        return (
          <div className="flex items-center gap-1 text-sm">
            {meal.type === "VEG" ? (
              <Leaf className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <UtensilsCrossed className="h-3.5 w-3.5 text-orange-500" />
            )}
            <span>
              {meal.type === "VEG"
                ? "Veg"
                : meal.nonVegType !== "NONE"
                  ? prettify(meal.nonVegType)
                  : "Non-Veg"}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "numberOfMeals",
      header: "Qty",
    },
    {
      accessorKey: "mealCharge",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Charge" />
      ),
      cell: ({ row }) => `₹${row.original.mealCharge.toFixed(2)}`,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]} size="sm">
          {prettify(row.original.status)}
        </Badge>
      ),
    },
  ]
}
