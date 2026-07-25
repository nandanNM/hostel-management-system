"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { format } from "date-fns"
import { GraduationCap, Loader2, MinusCircle, Plus } from "lucide-react"
import { toast } from "sonner"

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
import UserAvatar from "@/components/UserAvatar"

import type { UserSummary } from "../_lib/user-detail"
import {
  addUserDue,
  recordPayment,
  transferUserToAlumni,
} from "../_lib/user-detail"

function inr(n: number) {
  return `₹${n.toFixed(2)}`
}

export function UserDetailHeader({ data }: { data: UserSummary }) {
  const [payOpen, setPayOpen] = useState(false)
  const [dueOpen, setDueOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const { user, summary } = data

  // Add-due and transfer-to-alumni are mess-prefect-only. The server actions
  // enforce this too; here we only surface the controls on the prefect's routes.
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
            startTransition(async () => {
              const res = await recordPayment({
                userId,
                amount: Number(form.get("amount")),
                paymentMethod: String(form.get("paymentMethod") ?? ""),
                transactionId: String(form.get("transactionId") ?? ""),
              })
              if (res.status === "success") {
                toast.success(res.message)
                router.refresh()
                onOpenChange(false)
              } else {
                toast.error(res.message)
              }
            })
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
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save payment
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
            startTransition(async () => {
              const res = await addUserDue({
                userId,
                amount: Number(form.get("amount")),
                description: String(form.get("description") ?? ""),
              })
              if (res.status === "success") {
                toast.success(res.message)
                router.refresh()
                onOpenChange(false)
              } else {
                toast.error(res.message)
              }
            })
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
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
            startTransition(async () => {
              const res = await transferUserToAlumni({
                userId,
                department: String(form.get("department") ?? ""),
                year: String(form.get("year") ?? ""),
                mobileNumber: String(form.get("mobileNumber") ?? ""),
              })
              if (res.status === "success") {
                toast.success(res.message)
                onOpenChange(false)
                // The user is now archived — leave their (empty) detail page.
                router.push("/mess-prefect/users")
              } else {
                toast.error(res.message)
              }
            })
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
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Transfer to alumni
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
