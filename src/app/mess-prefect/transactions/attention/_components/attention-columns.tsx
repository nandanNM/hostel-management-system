"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { formatIST } from "@/lib/date"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Badge } from "@/components/reui/badge"

import type { AttentionRow, AttentionType } from "../_lib/validations"

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "B"
  )
}

export function getColumns(type: AttentionType): ColumnDef<AttentionRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all boarders on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${row.original.name}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Boarder" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarImage
              src={row.original.image ?? undefined}
              alt={row.original.name}
            />
            <AvatarFallback>{initials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.original.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {row.original.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "overdueCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Overdue bills" />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.overdueCount || "—"}
        </span>
      ),
    },
    {
      accessorKey: "daysOverdue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Age" />
      ),
      cell: ({ row }) => {
        const days = row.original.daysOverdue
        if (days <= 0) {
          return <span className="text-muted-foreground text-sm">—</span>
        }
        return (
          <Badge
            variant={
              days >= 60
                ? "destructive-light"
                : days >= 30
                  ? "warning-light"
                  : "secondary"
            }
            size="sm"
          >
            {days}d overdue
          </Badge>
        )
      },
    },
    {
      accessorKey: "oldestDueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Oldest unpaid" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {row.original.oldestDueDate
            ? formatIST(row.original.oldestDueDate)
            : "—"}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={type === "overdue" ? "Overdue amount" : "Outstanding"}
        />
      ),
      cell: ({ row }) => (
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            row.original.amount > 0 && "text-destructive"
          )}
        >
          {formatMoney(row.original.amount)}
        </span>
      ),
    },
  ]
}
