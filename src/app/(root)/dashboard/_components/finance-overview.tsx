import type { Icon } from "@phosphor-icons/react"
import {
  Gavel,
  Receipt,
  Wallet,
  WarningCircle,
} from "@phosphor-icons/react/ssr"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getUserFinanceOverview } from "../_lib/action"
import { SpendBreakdownChart } from "./finance-charts"

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

type Kpi = {
  title: string
  value: string
  subtitle: string
  icon: Icon
  iconClass: string
  bgClass: string
}

export async function FinanceOverview() {
  const data = await getUserFinanceOverview()
  if (!data) return null

  const { totalCharges, totalPaid, pendingDues, totalFines, breakdown } = data
  const paidPct =
    totalCharges > 0
      ? Math.min(100, Math.round((totalPaid / totalCharges) * 100))
      : 0

  const kpis: Kpi[] = [
    {
      title: "Total Costing",
      value: formatMoney(totalCharges),
      subtitle: "All charges to date",
      icon: Receipt,
      iconClass: "text-amber-600",
      bgClass: "bg-amber-600/10",
    },
    {
      title: "Total Paid",
      value: formatMoney(totalPaid),
      subtitle: "Payments received",
      icon: Wallet,
      iconClass: "text-green-600",
      bgClass: "bg-green-600/10",
    },
    {
      title: "Pending Dues",
      value: formatMoney(pendingDues),
      subtitle: "Outstanding balance",
      icon: WarningCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-600/10",
    },
    {
      title: "Total Fines",
      value: formatMoney(totalFines),
      subtitle: "Charged as penalties",
      icon: Gavel,
      iconClass: "text-blue-600",
      bgClass: "bg-blue-600/10",
    },
  ]

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-base">Where your money goes</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendBreakdownChart data={breakdown} />
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">Payment progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">
                  Paid of total
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {paidPct}%
                </span>
              </div>
              <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${paidPct}%` }}
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
                <dt className="text-muted-foreground">Total paid</dt>
                <dd className="font-medium text-green-600 tabular-nums dark:text-green-400">
                  {formatMoney(totalPaid)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <dt className="font-medium">Pending dues</dt>
                <dd
                  className={cn(
                    "font-bold tabular-nums",
                    pendingDues > 0 ? "text-red-600 dark:text-red-400" : ""
                  )}
                >
                  {formatMoney(pendingDues)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
