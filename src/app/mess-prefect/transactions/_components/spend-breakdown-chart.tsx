"use client"

import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart"
import { type ChartConfig } from "@/components/evilcharts/ui/recharts-chart"

type Slice = {
  category: string
  label: string
  amount: number
}

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
} satisfies ChartConfig

export function SpendBreakdownChart({ data }: { data: Slice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          No charges recorded yet.
        </p>
      </div>
    )
  }

  return (
    <EvilPieChart
      className="mx-auto aspect-auto! h-64 w-full"
      data={data}
      dataKey="amount"
      nameKey="category"
      config={CHART_CONFIG}
    >
      <EvilPieChart.Legend />
      <EvilPieChart.Tooltip />
      <EvilPieChart.Pie innerRadius={55} paddingAngle={3} cornerRadius={6} />
    </EvilPieChart>
  )
}
