"use client"

import * as React from "react"
import { Eye } from "@phosphor-icons/react"
import { ColumnDef } from "@tanstack/react-table"

import {
  levelOfActivityLog,
  prettifyActivityLogAction,
  summarizeActivityLogData,
  type ActivityLogLevel,
} from "@/lib/activity-log-display"
import { formatIST } from "@/lib/date"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Badge } from "@/components/reui/badge"

import type { ActivityLogRow } from "../_lib/actions"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const LEVEL_VARIANT: Record<ActivityLogLevel, BadgeVariant> = {
  info: "info-light",
  warning: "warning-light",
  error: "destructive-light",
}

function LogDetailsPopover({ log }: { log: ActivityLogRow }) {
  const before = summarizeActivityLogData(log.oldData)
  const after = summarizeActivityLogData(log.newData)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
          <span className="sr-only">View details</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 text-sm">
        {log.details && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              Details
            </p>
            <p className="bg-muted rounded p-2 text-sm">{log.details}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground mb-1 font-semibold tracking-wide uppercase">
              By
            </p>
            <p>{log.user.name ?? "Unknown"}</p>
            <p className="text-muted-foreground">{log.user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 font-semibold tracking-wide uppercase">
              Timestamp
            </p>
            <p>{formatIST(log.timestamp, "dd MMM yyyy, HH:mm:ss")}</p>
          </div>
        </div>

        {(before || after) && (
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Change
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {before && (
                <span className="bg-muted rounded px-2 py-1 line-through opacity-70">
                  {before}
                </span>
              )}
              {after && (
                <span className="bg-muted rounded px-2 py-1 font-medium">
                  {after}
                </span>
              )}
            </div>
          </div>
        )}

        {log.entityType && (
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Entity
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" size="sm">
                {log.entityType}
              </Badge>
              {log.entityId && (
                <Badge variant="secondary" size="sm">
                  {log.entityId}
                </Badge>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function getColumns(): ColumnDef<ActivityLogRow>[] {
  return [
    {
      accessorKey: "timestamp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="text-sm">
            {formatIST(row.original.timestamp, "dd MMM yyyy")}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatIST(row.original.timestamp, "HH:mm:ss")}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "actionType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) => {
        const level = levelOfActivityLog(row.original.actionType)
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant={LEVEL_VARIANT[level]}
              size="sm"
              className="capitalize"
            >
              {level}
            </Badge>
            <span className="text-sm font-medium">
              {prettifyActivityLogAction(row.original.actionType)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <p className={cn("max-w-md truncate text-sm")}>
          {row.original.details ??
            `${prettifyActivityLogAction(row.original.actionType)} on ${
              row.original.entityType ?? "System"
            }`}
        </p>
      ),
    },
    {
      accessorKey: "actor",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="By" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{row.original.user.name ?? "Unknown"}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.user.email}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <LogDetailsPopover log={row.original} />,
      size: 40,
    },
  ]
}
