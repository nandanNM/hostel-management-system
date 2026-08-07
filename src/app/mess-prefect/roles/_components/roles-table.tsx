"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { DataTableFilterField } from "@/types"

import { UserRoleType, UserStatusType } from "@/lib/generated/prisma"
import { toast } from "@/lib/toast"
import { useDataTable } from "@/hooks/use-data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader } from "@/components/ui/loader"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import {
  getUsersForRoles,
  updateManagerDetails,
  type RoleUser,
} from "../_lib/actions"
import { getColumns, prettify } from "./roles-table-columns"

interface RolesTableProps {
  usersPromise: ReturnType<typeof getUsersForRoles>
  currentUserId: string
}

export function RolesTable({ usersPromise, currentUserId }: RolesTableProps) {
  const { data, pageCount, totalRows } = React.use(usersPromise)
  const [editing, setEditing] = React.useState<RoleUser | null>(null)

  const columns = React.useMemo(
    () => getColumns({ currentUserId, onEdit: setEditing }),
    [currentUserId]
  )

  const filterFields: DataTableFilterField<RoleUser>[] = [
    {
      label: "User",
      value: "name",
      placeholder: "Search by name, email or room…",
    },
    {
      label: "Role",
      value: "role",
      options: Object.values(UserRoleType).map((role) => ({
        label: prettify(role),
        value: role,
        withCount: true,
      })),
    },
    {
      label: "Status",
      value: "status",
      options: Object.values(UserStatusType).map((status) => ({
        label: prettify(status),
        value: status,
        withCount: true,
      })),
    },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    state: {
      sorting: [{ id: "role", desc: false }],
      pagination: { pageIndex: 0, pageSize: 10 },
      columnPinning: { right: ["actions"] },
    },
  })

  const router = useRouter()

  return (
    <>
      <DataTable totalRows={totalRows} table={table}>
        <DataTableToolbar table={table} filterFields={filterFields} />
      </DataTable>

      <EditDetailsDialog
        user={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          router.refresh()
        }}
      />
    </>
  )
}

function EditDetailsDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: RoleUser | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [isPending, startTransition] = React.useTransition()

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit details</DialogTitle>
          <DialogDescription>
            Update the profile information for {user?.name ?? "this user"}.
          </DialogDescription>
        </DialogHeader>
        {user && (
          <form
            id="edit-manager-form"
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              startTransition(async () => {
                const res = await updateManagerDetails({
                  userId: user.id,
                  name: String(form.get("name") ?? ""),
                  selfPhNo: String(form.get("selfPhNo") ?? ""),
                  roomNo: String(form.get("roomNo") ?? ""),
                })
                if (res.status === "success") {
                  toast.success(res.message)
                  onSaved()
                } else {
                  toast.error(res.message)
                }
              })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selfPhNo">Phone number</Label>
              <Input
                id="selfPhNo"
                name="selfPhNo"
                defaultValue={user.selfPhNo ?? ""}
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNo">Room number</Label>
              <Input
                id="roomNo"
                name="roomNo"
                defaultValue={user.roomNo ?? ""}
                placeholder="e.g. B-204"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader variant="spinner" size={16} className="mr-2" />
                )}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
