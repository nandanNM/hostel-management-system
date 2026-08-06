"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PencilSimple as Pencil } from "@phosphor-icons/react"

import { UserRoleType, UserStatusType } from "@/lib/generated/prisma"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import UserAvatar from "@/components/UserAvatar"

import { assignRole, updateManagerDetails } from "../_lib/actions"
import { ASSIGNABLE_ROLES } from "../_lib/constants"

export interface ManagerUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRoleType
  status: UserStatusType
  selfPhNo: string | null
  roomNo: string | null
}

const FALLBACK_STYLE = "bg-muted text-muted-foreground"

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

const STATUS_STYLES: Partial<Record<UserStatusType, string>> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-muted text-muted-foreground",
  SUSPENDED: "bg-red-100 text-red-600",
  FORMA: "bg-muted text-muted-foreground",
}

function prettify(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

export function ManagersTable({
  users,
  currentUserId,
}: {
  users: ManagerUser[]
  currentUserId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingRoleUserId, setPendingRoleUserId] = useState<string | null>(
    null
  )
  const [editing, setEditing] = useState<ManagerUser | null>(null)

  function handleRoleChange(user: ManagerUser, role: string) {
    setPendingRoleUserId(user.id)
    startTransition(async () => {
      const res = await assignRole({
        userId: user.id,
        role: role as (typeof ASSIGNABLE_ROLES)[number],
      })
      setPendingRoleUserId(null)
      if (res.status === "success") {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>
          Promote boarders to Manager, step them back down, and keep manager
          profile details up to date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Assign role</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId
                const locked = isSelf
                const rowPending = isPending && pendingRoleUserId === user.id
                return (
                  <TableRow key={user.id}>
                    <TableCell>
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
                          <div className="text-muted-foreground text-xs">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.roomNo ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.selfPhNo ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          STATUS_STYLES[user.status] ?? FALLBACK_STYLE
                        )}
                      >
                        {prettify(user.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-semibold",
                          ROLE_STYLES[user.role] ?? FALLBACK_STYLE
                        )}
                      >
                        {prettify(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rowPending && (
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
                          disabled={locked || isPending}
                          onValueChange={(role) => handleRoleChange(user, role)}
                        >
                          <SelectTrigger className="ml-auto w-35">
                            <SelectValue
                              placeholder={
                                locked ? prettify(user.role) : "Select"
                              }
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditing(user)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <EditDetailsDialog
        user={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          router.refresh()
        }}
      />
    </Card>
  )
}

function EditDetailsDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: ManagerUser | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [isPending, startTransition] = useTransition()

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
