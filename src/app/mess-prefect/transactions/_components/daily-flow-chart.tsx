"use client"

import { TrendDown, TrendUp } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { EvilLineChart } from "@/components/evilcharts/charts/recharts-line-chart"
import { type ChartConfig } from "@/components/evilcharts/ui/recharts-chart"

type FlowPoint = {
  label: string
  meal: number
  guest: number
  fine: number
  other: number
  payment: number
}

/**
 * One line per entry type, sharing the colours used by the breakdown pie and
 * the charge-mix bar so a category reads the same everywhere on the page.
 */
const CHART_CONFIG = {
  meal: {
    label: "Meal charges",
    colors: { light: ["#f59e0b"], dark: ["#fbbf24"] },
  },
  guest: {
    label: "Guest meals",
    colors: { light: ["#3b82f6"], dark: ["#60a5fa"] },
  },
  fine: {
    label: "Fines",
    colors: { light: ["#ef4444"], dark: ["#f87171"] },
  },
  other: {
    label: "Other",
    colors: { light: ["#6b7280"], dark: ["#9ca3af"] },
  },
  payment: {
    label: "Payments",
    colors: { light: ["#059669"], dark: ["#34d399"] },
  },
} satisfies ChartConfig

const SERIES = ["meal", "guest", "fine", "other", "payment"] as const

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function compactMoney(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`
}

interface DailyFlowChartProps {
  data: FlowPoint[]
  total: number
  delta: number | null
  periodLabel: string
  granularity: "day" | "month"
}

export function DailyFlowChart({
  data,
  total,
  delta,
  periodLabel,
  granularity,
}: DailyFlowChartProps) {
  const hasData = data.some((point) => SERIES.some((key) => point[key] !== 0))
  const isUp = (delta ?? 0) >= 0
  const TrendIcon = isUp ? TrendUp : TrendDown

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
            {formatMoney(total)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Billed by type &middot; {periodLabel.toLowerCase()}
          </p>
        </div>

        {delta === null ? (
          <span className="text-muted-foreground text-xs">
            No prior period to compare
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              isUp
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            <TrendIcon className="size-4 shrink-0" weight="bold" />
            {isUp ? "+" : "−"}
            {Math.abs(delta).toFixed(1)}%
            <span className="text-muted-foreground font-normal">
              vs prior period
            </span>
          </span>
        )}
      </div>

      {hasData ? (
        <div className="h-64 w-full min-w-0 sm:h-80">
          <EvilLineChart
            data={data}
            config={CHART_CONFIG}
            className="aspect-auto! h-full w-full"
            curveType="bump"
          >
            <EvilLineChart.XAxis
              dataKey="label"
              minTickGap={granularity === "day" ? 28 : 12}
              interval="preserveStartEnd"
            />
            <EvilLineChart.YAxis
              tickFormatter={(value) => compactMoney(Number(value))}
            />
            <EvilLineChart.Legend isClickable />
            <EvilLineChart.Tooltip />
            {SERIES.map((key) => (
              <EvilLineChart.Line
                key={key}
                dataKey={key}
                strokeVariant="solid"
                isClickable
              >
                <EvilLineChart.Dot variant="default" />
                <EvilLineChart.ActiveDot variant="default" />
              </EvilLineChart.Line>
            ))}
          </EvilLineChart>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center sm:h-80">
          <p className="text-muted-foreground text-sm">
            No transactions in this period.
          </p>
        </div>
      )}
    </div>
  )
}
