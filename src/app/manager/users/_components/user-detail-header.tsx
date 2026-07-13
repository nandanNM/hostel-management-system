"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, Plus } from "lucide-react"
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
import { recordPayment } from "../_lib/user-detail"

function inr(n: number) {
  return `₹${n.toFixed(2)}`
}

export function UserDetailHeader({ data }: { data: UserSummary }) {
  const [payOpen, setPayOpen] = useState(false)
  const { user, summary } = data

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

      <Button onClick={() => setPayOpen(true)} className="w-full sm:w-auto">
        <Plus className="mr-1 h-4 w-4" /> Record payment
      </Button>

      <RecordPaymentDialog
        userId={user.id}
        currentDue={summary.currentDue}
        open={payOpen}
        onOpenChange={setPayOpen}
      />
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
        className={cn("mt-1 text-lg font-bold", highlight && "text-destructive")}
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
