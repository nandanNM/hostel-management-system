"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle as CheckCircle2,
  ClipboardText as ClipboardCheck,
  CircleNotch as Loader2,
  Receipt,
  SlidersHorizontal,
} from "@phosphor-icons/react"
import { format } from "date-fns"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import UserAvatar from "@/components/UserAvatar"

import { type BillingData } from "../_lib/actions"
import { useFinalizeBills, useSaveAuditDraft } from "../_lib/mutations"
import { BillingExclusionTable } from "./billing-exclusion-table"

const EXPENSE_FIELDS = [
  { key: "riceExpenses", label: "Rice" },
  { key: "vegetableExpenses", label: "Vegetables" },
  { key: "fishExpenses", label: "Fish / Meat" },
  { key: "groceryExpenses", label: "Grocery" },
  { key: "dailyExpenses", label: "Daily / Misc." },
  { key: "otherExpenses", label: "Other" },
] as const

type ExpenseState = {
  riceExpenses: number
  vegetableExpenses: number
  fishExpenses: number
  groceryExpenses: number
  dailyExpenses: number
  otherExpenses: number
  adjustment: number
}

const STEPS = [
  { n: 1, title: "Audit", icon: ClipboardCheck },
  { n: 2, title: "Adjust", icon: SlidersHorizontal },
  { n: 3, title: "Finalize", icon: Receipt },
] as const

function inr(n: number) {
  return `₹${n.toFixed(2)}`
}

export function BillingWorkflow({ data }: { data: BillingData }) {
  const { audit, isFinalized, stats, period, boarders, excludedUserIds } = data
  const { mutate: saveDraft, isPending: isSaving } = useSaveAuditDraft()
  const { mutate: finalize, isPending: isFinalizing } = useFinalizeBills()

  const [step, setStep] = useState<number>(isFinalized ? 3 : 1)
  const [expenses, setExpenses] = useState<ExpenseState>({
    riceExpenses: audit?.riceExpenses ?? 0,
    vegetableExpenses: audit?.vegetableExpenses ?? 0,
    fishExpenses: audit?.fishExpenses ?? 0,
    groceryExpenses: audit?.groceryExpenses ?? 0,
    dailyExpenses: audit?.dailyExpenses ?? 0,
    otherExpenses: audit?.otherExpenses ?? 0,
    adjustment: audit?.adjustment ?? 0,
  })

  const grandTotal = useMemo(
    () =>
      expenses.riceExpenses +
      expenses.vegetableExpenses +
      expenses.fishExpenses +
      expenses.groceryExpenses +
      expenses.dailyExpenses +
      expenses.otherExpenses,
    [expenses]
  )
  const perBoarder =
    stats.billableBoarders > 0
      ? (grandTotal + expenses.adjustment) / stats.billableBoarders
      : 0

  function setField(key: keyof ExpenseState, value: string) {
    const num = value === "" ? 0 : Number(value)
    setExpenses((prev) => ({
      ...prev,
      [key]: Number.isFinite(num) ? num : 0,
    }))
  }

  function handleSaveDraft() {
    saveDraft(
      { year: period.year, month: period.month, ...expenses },
      {
        onSuccess: (res) => {
          if (res.status === "success") setStep(3)
        },
      }
    )
  }

  function handleFinalize() {
    if (!audit) return
    finalize(audit.id)
  }

  const isPending = isSaving || isFinalizing

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = step === s.n
          const done = step > s.n || (isFinalized && s.n < 3)
          return (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => !isFinalized && setStep(s.n)}
                disabled={isFinalized}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              >
                <s.icon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {s.n}. {s.title}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <Separator className="flex-1" orientation="horizontal" />
              )}
            </div>
          )
        })}
      </div>

      {isFinalized && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/5 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Bills for {period.label} were finalized
          {audit?.approvedAt
            ? ` on ${format(new Date(audit.approvedAt), "dd MMM yyyy, p")}`
            : ""}{" "}
          — {data.distributedCount} bills distributed. This period is locked.
        </div>
      )}

      {step === 1 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Audit {period.label}</CardTitle>
              <CardDescription>
                Review last month&apos;s activity before preparing bills.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat label="Active boarders" value={stats.activeBoarders} />
                <Stat label="Billed boarders" value={stats.billableBoarders} />
                <Stat label="Excluded" value={stats.excludedCount} />
                <Stat label="Meals served" value={stats.mealsServed} />
              </div>
              <p className="text-muted-foreground text-sm">
                Guest meal charges and fines are billed to each user separately
                on their ledger. The monthly mess charge is split equally across
                the billed boarders below.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Continue to adjustments
                </Button>
              </div>
            </CardContent>
          </Card>

          <BillingExclusionTable
            year={period.year}
            month={period.month}
            boarders={boarders}
            excludedUserIds={excludedUserIds}
            disabled={isFinalized}
          />
        </>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Expenses & adjustments</CardTitle>
            <CardDescription>
              Enter the month&apos;s expenses. The per-boarder charge updates
              live and can be re-saved until you finalize.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EXPENSE_FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={f.key}>{f.label} (₹)</Label>
                  <Input
                    id={f.key}
                    type="number"
                    min={0}
                    step="0.01"
                    value={expenses[f.key] === 0 ? "" : expenses[f.key]}
                    placeholder="0"
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="adjustment">Adjustment (₹, +/−)</Label>
                <Input
                  id="adjustment"
                  type="number"
                  step="0.01"
                  value={expenses.adjustment === 0 ? "" : expenses.adjustment}
                  placeholder="0"
                  onChange={(e) => setField("adjustment", e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Grand total: </span>
                  <span className="font-semibold">{inr(grandTotal)}</span>
                  {expenses.adjustment !== 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      {expenses.adjustment > 0 ? "+" : "−"}{" "}
                      {inr(Math.abs(expenses.adjustment))} adj
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    ÷ {stats.billableBoarders} boarders ={" "}
                  </span>
                  <span className="text-primary text-base font-bold">
                    {inr(perBoarder)}
                  </span>
                  <span className="text-muted-foreground"> per boarder</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleSaveDraft} disabled={isPending}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save draft & continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Finalize & distribute</CardTitle>
            <CardDescription>
              Generate one bill per billed boarder. This locks {period.label}{" "}
              and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!audit ? (
              <p className="text-muted-foreground text-sm">
                Save the expense draft first (step 2) before distributing bills.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  <Stat label="Per boarder" value={inr(audit.mealCharge)} />
                  <Stat
                    label="Billed boarders"
                    value={stats.billableBoarders}
                  />
                  <Stat
                    label="Total to distribute"
                    value={inr(audit.mealCharge * stats.billableBoarders)}
                  />
                </div>
                {isFinalized ? (
                  <Badge
                    variant="outline"
                    className="border-green-500/40 text-green-700 dark:text-green-400"
                  >
                    Distributed to {data.distributedCount} users
                  </Badge>
                ) : (
                  <div className="flex flex-wrap justify-between gap-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Back to adjustments
                    </Button>
                    <Button onClick={handleFinalize} disabled={isPending}>
                      {isFinalizing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Finalize & distribute bills
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {data.distributedBills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated bills — {period.label}</CardTitle>
            <CardDescription>
              One bill per billed boarder. &ldquo;Guest (this mo.)&rdquo; is
              each user&apos;s approved/served guest-meal charges for{" "}
              {period.label}, already applied to their ledger in real time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Mess charge</TableHead>
                    <TableHead className="text-right">
                      Guest (this mo.)
                    </TableHead>
                    <TableHead className="text-right">Month total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.distributedBills.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar size={28} avatarUrl={b.user.image} />
                          <div>
                            <div className="font-medium">
                              {b.user.name ?? "Unnamed"}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {b.user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {inr(b.messCharge)}
                      </TableCell>
                      <TableCell className="text-right">
                        {b.guestCharge > 0 ? inr(b.guestCharge) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {inr(b.messCharge + b.guestCharge)}
                      </TableCell>
                      <TableCell className="text-right">
                        {inr(b.balanceRemaining)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  )
}
