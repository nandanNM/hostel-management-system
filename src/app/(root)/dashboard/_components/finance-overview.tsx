import { Suspense } from "react"
import type { Icon } from "@phosphor-icons/react"
import {
  Gavel,
  Receipt,
  Wallet,
  WarningCircle,
} from "@phosphor-icons/react/ssr"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"

import { getUserFinanceOverview } from "../_lib/action"
import { SpendBreakdownChart } from "./finance-charts"
import { FinanceRadarChart } from "./finance-radar-chart"
import UserActivity from "./user-activity"
import UserDetails from "./user-details.tsx"

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

export async function FinanceOverview({ userId }: { userId: string }) {
  const data = await getUserFinanceOverview()
  if (!data) return null

  const { totalCharges, totalPaid, pendingDues, totalFines, breakdown } = data

  const amountOf = (category: string) =>
    breakdown.find((slice) => slice.category === category)?.amount ?? 0
  const radarData = [
    { metric: "Meal", amount: amountOf("meal") },
    { metric: "Guest", amount: amountOf("guest") },
    { metric: "Fine", amount: totalFines },
    { metric: "Paid", amount: totalPaid },
    { metric: "Pending", amount: pendingDues },
  ]

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

      <div className="grid gap-6 lg:grid-cols-10">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="min-w-0 gap-3">
              <CardHeader>
                <CardTitle className="text-base">
                  Where your money goes
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 overflow-hidden">
                <SpendBreakdownChart data={breakdown} />
              </CardContent>
            </Card>

            <Card className="min-w-0 gap-3">
              <CardHeader>
                <CardTitle className="text-base">Account breakdown</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 overflow-hidden">
                <FinanceRadarChart data={radarData} />
              </CardContent>
            </Card>
          </div>

          <UserDetails userId={userId} />
        </div>

        <div className="min-w-0 lg:col-span-3">
          <Suspense
            fallback={
              <Loader variant="spinner" size={20} className="mx-auto my-8" />
            }
          >
            <UserActivity userId={userId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
