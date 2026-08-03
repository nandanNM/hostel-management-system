"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  GraduationCap,
  MinusCircle,
  PiggyBank,
  Plus,
} from "@phosphor-icons/react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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
import UserAvatar from "@/components/UserAvatar"

import {
  useAddUserAdvance,
  useAddUserDue,
  useRecordPayment,
  useTransferUserToAlumni,
} from "../_lib/mutations"
import type { UserSummary } from "../_lib/user-detail"

function inr(n: number) {
  return `₹${n.toFixed(2)}`
}

export function UserDetailHeader({ data }: { data: UserSummary }) {
  const [payOpen, setPayOpen] = useState(false)
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [dueOpen, setDueOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const { user, summary } = data

  const pathname = usePathname()
  const isMessPrefect = pathname.startsWith("/mess-prefect")
  const isArchived = user.status.toUpperCase() === "FORMA"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <UserAvatar size={48} avatarUrl={user.image} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {user.name ?? "Unnamed"}
          </h1>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
        </div>
        <Badge variant="outline" className="ml-auto capitalize">
          {user.status.toLowerCase()}
        </Badge>
      </div>

      <div className="text-muted-foreground grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Info label="Room" value={user.roomNo ?? "—"} />
        <Info label="Phone" value={user.selfPhNo ?? "—"} />
        <Info
          label="Role"
          value={
            user.role.charAt(0) +
            user.role.slice(1).toLowerCase().replace("_", " ")
          }
        />
        <Info
          label="Joined"
          value={
            user.joinDate ? format(new Date(user.joinDate), "dd MMM yyyy") : "—"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile
          label="Current due"
          value={inr(summary.currentDue)}
          highlight={summary.currentDue > 0}
        />
        <Tile label="Total paid" value={inr(summary.totalPaid)} />
        <Tile label="Total charged" value={inr(summary.totalCharged)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPayOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Record payment
        </Button>
        {isMessPrefect && (
          <>
            <Button variant="outline" onClick={() => setAdvanceOpen(true)}>
              <PiggyBank className="mr-1 h-4 w-4" /> Add advance
            </Button>
            <Button variant="outline" onClick={() => setDueOpen(true)}>
              <MinusCircle className="mr-1 h-4 w-4" /> Add due
            </Button>
            <Button
              variant="outline"
              disabled={isArchived}
              onClick={() => setTransferOpen(true)}
            >
              <GraduationCap className="mr-1 h-4 w-4" />
              {isArchived ? "Transferred to alumni" : "Transfer to alumni"}
            </Button>
          </>
        )}
      </div>

      <RecordPaymentDialog
        userId={user.id}
        currentDue={summary.currentDue}
        open={payOpen}
        onOpenChange={setPayOpen}
      />

      {isMessPrefect && (
        <>
          <AddAdvanceDialog
            userId={user.id}
            currentDue={summary.currentDue}
            open={advanceOpen}
            onOpenChange={setAdvanceOpen}
          />
          <AddDueDialog
            userId={user.id}
            currentDue={summary.currentDue}
            open={dueOpen}
            onOpenChange={setDueOpen}
          />
          <TransferToAlumniDialog
            userId={user.id}
            name={user.name}
            email={user.email}
            mobile={user.selfPhNo}
            open={transferOpen}
            onOpenChange={setTransferOpen}
          />
        </>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function Tile({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div
        className={cn(
          "mt-1 text-lg font-bold",
          highlight && "text-destructive"
        )}
      >
        {value}
      </div>
    </div>
  )
}

function RecordPaymentDialog({
  userId,
  currentDue,
  open,
  onOpenChange,
}: {
  userId: string
  currentDue: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { mutate, isPending } = useRecordPayment()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Current due: {inr(currentDue)}. This is deducted from the
            user&apos;s pending balance.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            mutate(
              {
                userId,
                amount: Number(form.get("amount")),
                paymentMethod: String(form.get("paymentMethod") ?? ""),
                transactionId: String(form.get("transactionId") ?? ""),
              },
              {
                onSuccess: (res) => {
                  if (res.status === "success") onOpenChange(false)
                },
              }
            )
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Method (optional)</Label>
            <Input
              id="paymentMethod"
              name="paymentMethod"
              placeholder="Cash / UPI / Bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID (optional)</Label>
            <Input
              id="transactionId"
              name="transactionId"
              placeholder="e.g. UPI ref"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader variant="spinner" size={16} className="mr-2" />
              )}
              Save payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddAdvanceDialog({
  userId,
  currentDue,
  open,
  onOpenChange,
}: {
  userId: string
  currentDue: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { mutate, isPending } = useAddUserAdvance()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add advance</DialogTitle>
          <DialogDescription>
            Current due: {inr(currentDue)}. Records money paid in advance as a
            credit on the user&apos;s account and notifies them by email.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            mutate(
              {
                userId,
                amount: Number(form.get("amount")),
                paymentMethod: String(form.get("paymentMethod") ?? ""),
                note: String(form.get("note") ?? ""),
              },
              {
                onSuccess: (res) => {
                  if (res.status === "success") onOpenChange(false)
                },
              }
            )
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="advance-amount">Amount (₹)</Label>
            <Input
              id="advance-amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advance-method">Method (optional)</Label>
            <Input
              id="advance-method"
              name="paymentMethod"
              placeholder="Cash / UPI / Bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advance-note">Note (optional)</Label>
            <Input
              id="advance-note"
              name="note"
              placeholder="e.g. Advance for next month"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader variant="spinner" size={16} className="mr-2" />
              )}
              Save advance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddDueDialog({
  userId,
  currentDue,
  open,
  onOpenChange,
}: {
  userId: string
  currentDue: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { mutate, isPending } = useAddUserDue()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add due</DialogTitle>
          <DialogDescription>
            Current due: {inr(currentDue)}. This is added to the user&apos;s
            outstanding balance and they are notified by email.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            mutate(
              {
                userId,
                amount: Number(form.get("amount")),
                description: String(form.get("description") ?? ""),
              },
              {
                onSuccess: (res) => {
                  if (res.status === "success") onOpenChange(false)
                },
              }
            )
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="due-amount">Amount (₹)</Label>
            <Input
              id="due-amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due-description">Reason</Label>
            <Input
              id="due-description"
              name="description"
              required
              placeholder="e.g. Damage charge, extra mess days"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader variant="spinner" size={16} className="mr-2" />
              )}
              Add due
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TransferToAlumniDialog({
  userId,
  name,
  email,
  mobile,
  open,
  onOpenChange,
}: {
  userId: string
  name: string | null
  email: string
  mobile: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { mutate, isPending } = useTransferUserToAlumni()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer to alumni</DialogTitle>
          <DialogDescription>
            {name ?? "This user"} will be moved to the alumni directory and
            archived as a former boarder. They will be removed from all active
            lists and can no longer log in.{" "}
            <strong>All their financial records are preserved.</strong> This
            cannot be undone from here.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            mutate(
              {
                userId,
                department: String(form.get("department") ?? ""),
                year: String(form.get("year") ?? ""),
                mobileNumber: String(form.get("mobileNumber") ?? ""),
              },
              {
                onSuccess: (res) => {
                  if (res.status === "success") onOpenChange(false)
                },
              }
            )
          }}
          className="space-y-4"
        >
          <div className="text-muted-foreground grid grid-cols-2 gap-3 rounded-md border p-3 text-sm">
            <div>
              <span className="block text-xs">Name</span>
              <span className="text-foreground">{name ?? "Unnamed"}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-xs">Email</span>
              <span className="text-foreground truncate">{email}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-department">Department</Label>
              <Input
                id="transfer-department"
                name="department"
                required
                placeholder="e.g. Physics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-year">Passing year</Label>
              <Input
                id="transfer-year"
                name="year"
                required
                placeholder="e.g. 2024"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-mobile">Mobile number</Label>
            <Input
              id="transfer-mobile"
              name="mobileNumber"
              defaultValue={mobile ?? ""}
              placeholder="e.g. 9876543210"
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && (
                <Loader variant="spinner" size={16} className="mr-2" />
              )}
              Transfer to alumni
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
