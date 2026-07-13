"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { BillEntryType } from "@/lib/generated/prisma"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserAvatar from "@/components/UserAvatar"

import type { UserBillingDetail } from "../_lib/user-detail"
import { recordPayment } from "../_lib/user-detail"

const TYPE_LABELS: Record<BillEntryType, string> = {
  SECURITY_DEPOSIT: "Security deposit",
  REFUND: "Refund",
  MEAL_CHARGE: "Mess charge",
  FINE_CHARGE: "Fine",
  GUEST_MEAL_CHARGE: "Guest meal",
  PAYMENT: "Payment",
  ADJUSTMENT_CREDIT: "Adjustment credit",
  ADJUSTMENT_DEBIT: "Adjustment debit",
}

function inr(n: number) {
  return `₹${n.toFixed(2)}`
}

function titleCase(v: string) {
  return v.charAt(0) + v.slice(1).toLowerCase()
}

export function UserDetailView({
  data,
  backHref,
}: {
  data: UserBillingDetail
  backHref: string
}) {
  const [payOpen, setPayOpen] = useState(false)
  const { user, summary, bills, payments, mealHistory, guestMeals, fines } =
    data

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      {/* Identity */}
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
          value={titleCase(user.role.replace("_", " "))}
        />
        <Info
          label="Joined"
          value={
            user.joinDate ? format(new Date(user.joinDate), "dd MMM yyyy") : "—"
          }
        />
      </div>

      {/* Summary + action */}
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

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
          <TabsTrigger value="guest">Guest Meals</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3">
          <SectionTitle>Full account ledger</SectionTitle>
          <LedgerTable rows={bills} showBalance />
        </TabsContent>

        <TabsContent value="payments" className="mt-3">
          {payments.length === 0 ? (
            <Empty text="No payments recorded yet." />
          ) : (
            <LedgerTable rows={payments} />
          )}
        </TabsContent>

        <TabsContent value="meals" className="mt-3">
          {mealHistory.length === 0 ? (
            <Empty text="No meal on/off changes recorded." />
          ) : (
            <div className="space-y-2">
              {mealHistory.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{m.details ?? "Meal status changed"}</span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(m.timestamp), "dd MMM, p")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="guest" className="mt-3">
          {guestMeals.length === 0 ? (
            <Empty text="No guest meals." />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Charge</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guestMeals.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(new Date(g.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        {g.numberOfMeals}
                      </TableCell>
                      <TableCell className="text-right">
                        {inr(g.mealCharge)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {g.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fines" className="mt-3">
          {fines.length === 0 ? (
            <Empty text="No fines." />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fines.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.reason}</TableCell>
                      <TableCell className="text-right">
                        {inr(f.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {f.dueDate
                          ? format(new Date(f.dueDate), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {f.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
      <div className={cn("mt-1 text-lg font-bold", highlight && "text-destructive")}>
        {value}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mb-2 text-xs">{children}</p>
}

function Empty({ text }: { text: string }) {
  return <p className="text-muted-foreground py-6 text-center text-sm">{text}</p>
}

type LedgerRow = {
  id: string
  type: BillEntryType
  amount: number
  description: string | null
  balanceRemaining: number
  createdAt: Date
}

function LedgerTable({
  rows,
  showBalance,
}: {
  rows: LedgerRow[]
  showBalance?: boolean
}) {
  if (rows.length === 0) return <Empty text="No entries." />
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {showBalance && (
              <TableHead className="text-right">Balance</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="font-medium">{TYPE_LABELS[r.type]}</div>
                {r.description && (
                  <div className="text-muted-foreground max-w-50 truncate text-xs">
                    {r.description}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {format(new Date(r.createdAt), "dd MMM yyyy")}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium",
                  r.amount < 0 ? "text-green-600" : "text-foreground"
                )}
              >
                {r.amount < 0 ? "−" : ""}
                {inr(Math.abs(r.amount))}
              </TableCell>
              {showBalance && (
                <TableCell className="text-right">
                  {inr(r.balanceRemaining)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
