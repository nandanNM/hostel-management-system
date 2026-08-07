"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PencilSimple as Pencil } from "@phosphor-icons/react"
import { ColumnDef } from "@tanstack/react-table"

import { UserRoleType, UserStatusType } from "@/lib/generated/prisma"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Badge } from "@/components/reui/badge"
import UserAvatar from "@/components/UserAvatar"

import { assignRole, type RoleUser } from "../_lib/actions"
import { ASSIGNABLE_ROLES } from "../_lib/constants"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

// Partial on purpose: a role with no entry falls back to a neutral badge
// rather than failing the build.
const ROLE_STYLES: Partial<Record<UserRoleType, string>> = {
  STUDENT: "bg-secondary text-secondary-foreground",
  TEMPORARY_BOARDER: "bg-muted text-muted-foreground",
  STAFF: "bg-blue-100 text-blue-700",
  MANAGER: "bg-primary/15 text-primary",
  MESS_PREFECT: "bg-amber-100 text-amber-700",
  AUDITOR: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  SUPER_ADMIN: "bg-red-200 text-red-800",
}

const STATUS_VARIANT: Partial<Record<UserStatusType, BadgeVariant>> = {
  ACTIVE: "success-light",
  INACTIVE: "secondary",
  SUSPENDED: "destructive-light",
  FORMA: "secondary",
}

export function prettify(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

export function getColumns({
  currentUserId,
  onEdit,
}: {
  currentUserId: string
  onEdit: (user: RoleUser) => void
}): ColumnDef<RoleUser>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original
        const isSelf = user.id === currentUserId
        return (
          <div className="flex items-center gap-3">
            <UserAvatar size={32} avatarUrl={user.image} />
            <div>
              <div className="font-medium">
                {user.name ?? "Unnamed"}
                {isSelf && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    (you)
                  </span>
                )}
              </div>
              <div className="text-muted-foreground text-xs">{user.email}</div>
            </div>
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
    {
      accessorKey: "selfPhNo",
      header: "Phone",
      cell: ({ row }) => row.original.selfPhNo ?? "—",
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
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => (
        <Badge
          size="sm"
          className={cn(
            "font-semibold",
            ROLE_STYLES[row.original.role] ?? "bg-muted text-muted-foreground"
          )}
        >
          {prettify(row.original.role)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: function Cell({ row }) {
        const user = row.original
        const router = useRouter()
        const [isPending, startTransition] = React.useTransition()
        const isSelf = user.id === currentUserId

        function handleRoleChange(role: string) {
          startTransition(async () => {
            const res = await assignRole({
              userId: user.id,
              role: role as (typeof ASSIGNABLE_ROLES)[number],
            })
            if (res.status === "success") {
              toast.success(res.message)
              router.refresh()
            } else {
              toast.error(res.message)
            }
          })
        }

        return (
          <div className="flex items-center justify-end gap-2">
            {isPending && (
              <Loader
                variant="spinner"
                size={16}
                className="text-muted-foreground"
              />
            )}
            <Select
              value={
                ASSIGNABLE_ROLES.includes(
                  user.role as (typeof ASSIGNABLE_ROLES)[number]
                )
                  ? user.role
                  : undefined
              }
              disabled={isSelf || isPending}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="w-35">
                <SelectValue
                  placeholder={isSelf ? prettify(user.role) : "Select"}
                />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {prettify(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(user)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit details</span>
            </Button>
          </div>
        )
      },
      size: 40,
    },
  ]
}
