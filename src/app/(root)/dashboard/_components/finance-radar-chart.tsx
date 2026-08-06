"use client"

import { EvilRadarChart } from "@/components/evilcharts/charts/recharts-radar-chart"
import { type ChartConfig } from "@/components/evilcharts/ui/recharts-chart"

type RadarPoint = {
  metric: string
  amount: number
}

const CHART_CONFIG = {
  amount: {
    label: "Amount (₹)",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
} satisfies ChartConfig

export function FinanceRadarChart({ data }: { data: RadarPoint[] }) {
  const hasValue = data.some((point) => point.amount > 0)
  if (!hasValue) {
    return (
      <div className="flex h-56 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          No financial activity yet.
        </p>
      </div>
    )
  }

  return (
    <EvilRadarChart
      data={data}
      config={CHART_CONFIG}
      className="mx-auto h-56 w-full"
    >
      <EvilRadarChart.PolarGrid />
      <EvilRadarChart.PolarAngleAxis dataKey="metric" />
      <EvilRadarChart.Tooltip />
      <EvilRadarChart.Radar dataKey="amount" variant="filled">
        <EvilRadarChart.Dot variant="colored-border" />
        <EvilRadarChart.ActiveDot variant="default" />
      </EvilRadarChart.Radar>
    </EvilRadarChart>
  )
}
