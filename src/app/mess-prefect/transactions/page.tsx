import type { Icon } from "@phosphor-icons/react"
import {
  Gavel,
  Receipt,
  Wallet,
  WarningCircle,
} from "@phosphor-icons/react/ssr"
import { format } from "date-fns"

import { BillEntryType } from "@/lib/generated/prisma"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SpendBreakdownChart } from "./_components/spend-breakdown-chart"
import { getTransactionsOverview } from "./_lib/actions"

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

const BADGE_CLASS: Partial<Record<BillEntryType, string>> = {
  PAYMENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  GUEST_MEAL_CHARGE:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  FINE_CHARGE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  MEAL_CHARGE:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
}

type Kpi = {
  title: string
  value: string
  icon: Icon
  iconClass: string
  bgClass: string
}

export default async function TransactionsPage() {
  const data = await getTransactionsOverview()
  const {
    totalCharges,
    totalCollected,
    totalOutstanding,
    totalFines,
    breakdown,
    recent,
  } = data

  const collectedPct =
    totalCharges > 0
      ? Math.min(100, Math.round((totalCollected / totalCharges) * 100))
      : 0

  const kpis: Kpi[] = [
    {
      title: "Total Costing",
      value: formatMoney(totalCharges),
      icon: Receipt,
      iconClass: "text-amber-600",
      bgClass: "bg-amber-600/10",
    },
    {
      title: "Total Collected",
      value: formatMoney(totalCollected),
      icon: Wallet,
      iconClass: "text-green-600",
      bgClass: "bg-green-600/10",
    },
    {
      title: "Pending Dues",
      value: formatMoney(totalOutstanding),
      icon: WarningCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-600/10",
    },
    {
      title: "Total Fines",
      value: formatMoney(totalFines),
      icon: Gavel,
      iconClass: "text-blue-600",
      bgClass: "bg-blue-600/10",
    },
  ]

  return (
    <div className="w-full flex-1 space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            A financial overview of every boarder&apos;s charges and payments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="gap-0 py-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  kpi.bgClass
                )}
              >
                <kpi.icon className={cn("size-5", kpi.iconClass)} />
              </div>
              <div className="min-w-0">
                <p className="text-lg leading-tight font-bold tabular-nums">
                  {kpi.value}
                </p>
                <p className="text-muted-foreground truncate text-xs font-medium">
                  {kpi.title}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">Charges breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendBreakdownChart data={breakdown} />
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">Collection progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">
                  Collected of total
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {collectedPct}%
                </span>
              </div>
              <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${collectedPct}%` }}
                />
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total costing</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(totalCharges)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total collected</dt>
                <dd className="font-medium text-green-600 tabular-nums dark:text-green-400">
                  {formatMoney(totalCollected)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <dt className="font-medium">Pending dues</dt>
                <dd
                  className={cn(
                    "font-bold tabular-nums",
                    totalOutstanding > 0 ? "text-red-600 dark:text-red-400" : ""
                  )}
                >
                  {formatMoney(totalOutstanding)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Boarder</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(tx.issueDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.userName ?? "Boarder"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            BADGE_CLASS[tx.type] ?? "bg-muted text-foreground"
                          )}
                        >
                          {tx.type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold tabular-nums",
                          tx.amount > 0
                            ? "text-destructive"
                            : "text-green-600 dark:text-green-400"
                        )}
                      >
                        {tx.amount > 0 ? "+" : "−"}
                        {formatMoney(Math.abs(tx.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
