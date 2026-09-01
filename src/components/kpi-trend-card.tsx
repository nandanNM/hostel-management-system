"use client"

import * as React from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"

import { Card, CardContent } from "@/components/ui/card"

export interface KpiTrendCardProps {
  title: string
  period: string
  value: string | number
  /** One point per day - a sparse series still renders, just as a flat line. */
  data: { value: number }[]
  /** A CSS color - a token like `var(--primary)` or a raw color. */
  color: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  formatTooltip?: (value: number) => string
}

export function KpiTrendCard({
  title,
  period,
  value,
  data,
  color,
  icon: Icon,
  formatTooltip,
}: KpiTrendCardProps) {
  const gradientId = React.useId().replace(/:/g, "")

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2">
          <Icon className="size-5" style={{ color }} />
          <span className="text-base font-semibold">{title}</span>
        </div>

        <div className="flex items-end justify-between gap-2.5">
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-sm whitespace-nowrap">
              {period}
            </div>
            <div className="text-foreground text-3xl font-bold tracking-tight tabular-nums">
              {value}
            </div>
          </div>

          <div className="h-16 w-full max-w-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <Tooltip
                  cursor={{
                    stroke: color,
                    strokeWidth: 1,
                    strokeDasharray: "2 2",
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const point = payload[0]?.value as number
                    return (
                      <div className="bg-background/95 border-border pointer-events-none rounded-lg border p-2 shadow-lg backdrop-blur-sm">
                        <p className="text-foreground text-sm font-semibold">
                          {formatTooltip ? formatTooltip(point) : point}
                        </p>
                      </div>
                    )
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  fill={`url(#${gradientId})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: color,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
