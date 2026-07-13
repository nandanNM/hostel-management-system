"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, Plus } from "lucide-react"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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

import { getUserBillingDetail, recordPayment } from "../_lib/user-detail"

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

export function UserDetailSheet({
  userId,
  open,
  onOpenChange,
}: {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [payOpen, setPayOpen] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => getUserBillingDetail(userId),
    enabled: open,
    refetchOnWindowFocus: false,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-xl sm:p-6">
        <SheetHeader className="px-0">
          <SheetTitle>User details</SheetTitle>
          <SheetDescription>
            Status, billing, payments and meal history.
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {isError && (
          <p className="text-destructive py-8 text-center text-sm">
            {error instanceof Error ? error.message : "Failed to load details."}
          </p>
        )}

        {data && (
          <div className="space-y-6">
            {/* Identity */}
            <div className="flex flex-wrap items-center gap-3">
              <UserAvatar size={44} avatarUrl={data.user.image} />
              <div className="min-w-0">
                <div className="truncate font-semibold">
                  {data.user.name ?? "Unnamed"}
                </div>
                <div className="text-muted-foreground truncate text-sm">
                  {data.user.email}
                </div>
              </div>
              <Badge variant="outline" className="ml-auto capitalize">
                {data.user.status.toLowerCase()}
              </Badge>
            </div>

            <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div>
                <span className="block text-xs">Room</span>
                <span className="text-foreground">
                  {data.user.roomNo ?? "—"}
                </span>
              </div>
              <div>
                <span className="block text-xs">Phone</span>
                <span className="text-foreground">
                  {data.user.selfPhNo ?? "—"}
                </span>
              </div>
              <div>
                <span className="block text-xs">Role</span>
                <span className="text-foreground capitalize">
                  {data.user.role.toLowerCase().replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="block text-xs">Joined</span>
                <span className="text-foreground">
                  {data.user.joinDate
                    ? format(new Date(data.user.joinDate), "dd MMM yyyy")
                    : "—"}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryTile
                label="Current due"
                value={inr(data.summary.currentDue)}
                highlight={data.summary.currentDue > 0}
              />
              <SummaryTile
                label="Total paid"
                value={inr(data.summary.totalPaid)}
              />
              <SummaryTile
                label="Total charged"
                value={inr(data.summary.totalCharged)}
              />
            </div>

            <Button onClick={() => setPayOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-1 h-4 w-4" />
              Record payment
            </Button>

            {/* Histories */}
            <Tabs defaultValue="billing">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="meals">Meals</TabsTrigger>
              </TabsList>

              <TabsContent value="billing" className="mt-3">
                <LedgerTable rows={data.bills} showBalance />
              </TabsContent>

              <TabsContent value="payments" className="mt-3">
                {data.payments.length === 0 ? (
                  <Empty text="No payments recorded yet." />
                ) : (
                  <LedgerTable rows={data.payments} />
                )}
              </TabsContent>

              <TabsContent value="meals" className="mt-3">
                {data.mealHistory.length === 0 ? (
                  <Empty text="No meal on/off changes recorded." />
                ) : (
                  <div className="space-y-2">
                    {data.mealHistory.map((m) => (
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
            </Tabs>
          </div>
        )}
      </SheetContent>

      <RecordPaymentDialog
        userId={userId}
        currentDue={data?.summary.currentDue ?? 0}
        open={payOpen}
        onOpenChange={setPayOpen}
      />
    </Sheet>
  )
}

function SummaryTile({
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

function Empty({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground py-6 text-center text-sm">{text}</p>
  )
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
            {showBalance && <TableHead className="text-right">Balance</TableHead>}
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
  const queryClient = useQueryClient()
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
                queryClient.invalidateQueries({
                  queryKey: ["user-detail", userId],
                })
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
            <Input id="transactionId" name="transactionId" placeholder="e.g. UPI ref" />
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
