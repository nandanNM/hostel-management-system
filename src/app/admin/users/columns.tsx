"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  Ban,
  Copy,
  Crown,
  Eye,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type UserRow = {
  id: string
  name: string
  email: string
  dueAmount: number
  status: "active" | "inactive" | "banned" | "suspended"
  role: "user" | "admin" | "manager" | "ex"
}

export const userColumns: ColumnDef<UserRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <div className="flex items-center gap-2">
          {role === "admin" && <Crown className="h-4 w-4 text-yellow-500" />}
          {role === "manager" && <Shield className="h-4 w-4 text-blue-500" />}
          {role === "user" && <UserCheck className="h-4 w-4 text-gray-500" />}
          <span className="capitalize">{role}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "dueAmount",
    header: () => <div className="text-right">Due Amount</div>,
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("dueAmount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div
          className={cn(
            "w-max rounded-md px-2 py-1 text-xs font-medium capitalize",
            status === "active" && "bg-green-100 text-green-800",
            status === "inactive" && "bg-gray-100 text-gray-800",
            status === "banned" && "bg-red-100 text-red-800",
            status === "suspended" && "bg-orange-100 text-orange-800",
            status === "ex" && "bg-fuchsia-100 text-fuchsia-800"
          )}
        >
          {status}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original

      const handleAction = (action: string) => {
        // In a real app, you would call your API here
        console.log(`${action} user:`, user.id)
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>User Actions</DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
              className="cursor-pointer"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy User ID
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleAction("view")}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Role Management */}
            {user.role !== "admin" && (
              <DropdownMenuItem
                onClick={() => handleAction("promote-admin")}
                className="cursor-pointer text-yellow-600"
              >
                <Crown className="mr-2 h-4 w-4" />
                Promote to Admin
              </DropdownMenuItem>
            )}

            {user.role !== "manager" && user.role !== "admin" && (
              <DropdownMenuItem
                onClick={() => handleAction("promote-manager")}
                className="cursor-pointer text-blue-600"
              >
                <Shield className="mr-2 h-4 w-4" />
                Promote to Manager
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Status Management */}
            {user.status !== "suspended" && user.status !== "banned" && (
              <DropdownMenuItem
                onClick={() => handleAction("suspend")}
                className="cursor-pointer text-orange-600"
              >
                <UserX className="mr-2 h-4 w-4" />
                Suspend User
              </DropdownMenuItem>
            )}

            {user.status !== "banned" && (
              <DropdownMenuItem
                onClick={() => handleAction("ban")}
                className="cursor-pointer text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Ban User
              </DropdownMenuItem>
            )}

            {(user.status === "suspended" || user.status === "banned") && (
              <DropdownMenuItem
                onClick={() => handleAction("reactivate")}
                className="cursor-pointer text-green-600"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Reactivate User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
