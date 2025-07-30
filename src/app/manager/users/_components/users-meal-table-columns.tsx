"use client"

import * as React from "react"
import { MealStatusType, NonVegType } from "@/generated/prisma"
import { ColumnDef } from "@tanstack/react-table"
import {
  CheckCircle,
  Clock,
  Copy,
  Edit2,
  Eye,
  MoreHorizontal,
  RefreshCcw,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { GetMealWithUser } from "@/types/prisma.type"
import { getErrorMessage } from "@/lib/handle-error"
import { formatDate } from "@/lib/utils"
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
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import UserAvatar from "@/components/UserAvatar"

import { updateUserMealStatus } from "../_lib/actions"
import { getMealStatusIcon, getNonVegTypeIcon } from "../_lib/utils"
import { UpdateMealSheet } from "./update-users-meal-sheet"

export function getColumns(): ColumnDef<GetMealWithUser>[] {
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
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "user",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const meal = row.original
        const user = meal.user
        return (
          <div className="flex items-center space-x-3">
            <UserAvatar avatarUrl={user.image} size={38} />
            <div>
              <div className="font-medium">{user.name || "Unknown User"}</div>
              <div className="text-muted-foreground text-sm">
                +91 {user.selfPhNo}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorFn: (row) => row.user.email ?? "No Email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: "nonVegType",
      header: "Type",
      cell: ({ row }) => {
        const nonVegType = row.original.nonVegType
        const Icon = getNonVegTypeIcon(nonVegType)

        return (
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4" />
            <span className="capitalize">
              {nonVegType === NonVegType.NONE
                ? "Vegetarian"
                : nonVegType.toLowerCase()}
            </span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status

        if (!status) return null

        const Icon = getMealStatusIcon(status)

        return (
          <div className="flex w-[6.25rem] items-center">
            <Icon
              className="text-muted-foreground mr-2 size-4"
              aria-hidden="true"
            />
            <span className="capitalize">{status.toLowerCase()}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated At" />
      ),
      cell: ({ cell }) => formatDate(cell.getValue() as Date),
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const [showUpdateMealSheet, setShowUpdateMealSheet] =
          React.useState(false)
        const meal = row.original
        const handleAction = async (action: string) => {
          switch (action) {
            case "activate-meal":
              toast.promise(
                updateUserMealStatus(meal.id, MealStatusType.ACTIVE),
                {
                  loading: "Activating user meal...",
                  success: "User meal activated successfully",
                  error: (err) => getErrorMessage(err),
                }
              )
              break
            case "deactivate-meal":
              toast.promise(
                updateUserMealStatus(meal.id, MealStatusType.INACTIVE),
                {
                  loading: "Deactivating user meal...",
                  success: "User meal deactivated successfully",
                  error: (err) => getErrorMessage(err),
                }
              )
              break
            case "suspend-meal":
              toast.promise(
                updateUserMealStatus(meal.id, MealStatusType.SUSPENDED),
                {
                  loading: "Suspending user meal...",
                  success: "User meal suspended successfully",
                  error: (err) => getErrorMessage(err),
                }
              )
              break
            case "unsuspend-meal":
              toast.promise(
                updateUserMealStatus(meal.id, MealStatusType.ACTIVE),
                {
                  loading: "Unsuspending user meal...",
                  success: "User meal unsuspended successfully",
                  error: (err) => getErrorMessage(err),
                }
              )
              break
            case "view":
            default:
              console.log(`${action} meal for meal:`, meal.id)
          }
        }
        return (
          <>
            <UpdateMealSheet
              open={showUpdateMealSheet}
              onOpenChange={setShowUpdateMealSheet}
              meal={row.original}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Meal Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(meal.id)}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy meal ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAction("view")}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => setShowUpdateMealSheet(true)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Meal Status Management */}
                {meal.status === MealStatusType.INACTIVE && (
                  <DropdownMenuItem
                    onClick={() => handleAction("activate-meal")}
                    className="cursor-pointer text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate Meal
                  </DropdownMenuItem>
                )}
                {meal.status === MealStatusType.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() => handleAction("deactivate-meal")}
                    className="cursor-pointer text-gray-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Deactivate Meal
                  </DropdownMenuItem>
                )}
                {meal.status !== MealStatusType.SUSPENDED && (
                  <DropdownMenuItem
                    onClick={() => handleAction("suspend-meal")}
                    className="cursor-pointer text-orange-600"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Suspend Meal
                  </DropdownMenuItem>
                )}
                {meal.status === MealStatusType.SUSPENDED && (
                  <DropdownMenuItem
                    onClick={() => handleAction("unsuspend-meal")}
                    className="cursor-pointer text-blue-600"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Unsuspend Meal
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )
      },
      size: 40,
    },
  ]
}
