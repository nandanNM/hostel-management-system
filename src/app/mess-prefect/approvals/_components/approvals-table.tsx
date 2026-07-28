"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, UserCheck, X } from "@phosphor-icons/react"
import { format } from "date-fns"

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
import { Loader } from "@/components/ui/loader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import UserAvatar from "@/components/UserAvatar"

import { approveUser, rejectUser } from "../_lib/actions"

export interface PendingUser {
  id: string
  name: string | null
  email: string
  image: string | null
  selfPhNo: string | null
  roomNo: string | null
  onboardingCompleted: boolean
  createdAt: Date
}

export function ApprovalsTable({ users }: { users: PendingUser[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function run(
    action: typeof approveUser | typeof rejectUser,
    userId: string,
    okFallback: string
  ) {
    setBusyId(userId)
    startTransition(async () => {
      const res = await action({ userId })
      setBusyId(null)
      if (res.status === "success") {
        toast.success(res.message || okFallback)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Pending Approvals
        </CardTitle>
        <CardDescription>
          New boarders awaiting activation. Approve to grant access, or reject
          to suspend the account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            No pending approvals right now. 🎉
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const rowBusy = isPending && busyId === user.id
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar size={32} avatarUrl={user.image} />
                          <div>
                            <div className="font-medium">
                              {user.name ?? "Unnamed"}
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
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-semibold",
                            user.onboardingCompleted
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          {user.onboardingCompleted
                            ? "Completed"
                            : "Incomplete"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(user.createdAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {rowBusy && (
                            <Loader
                              variant="comet"
                              size={16}
                              className="text-muted-foreground"
                            />
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              run(rejectUser, user.id, "User rejected.")
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              run(approveUser, user.id, "User approved.")
                            }
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
