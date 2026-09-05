"use client"

import React from "react"
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts"

import { Card, CardContent } from "@/components/ui/card"

export interface SparkPoint {
  value: number
}

interface KpiSparkCardProps {
  title: string
  /** Supporting line under the title. */
  metric: string
  baseValue: string
  baseLabel: string
  targetValue: string
  targetLabel: string
  data: SparkPoint[]
  /** Any CSS colour, e.g. `var(--color-amber-500)`. */
  color: string
}

function formatMoney(value: number) {
  const sign = value < 0 ? "−" : "+"
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`
}

export function KpiSparkCard({
  title,
  metric,
  baseValue,
  baseLabel,
  targetValue,
  targetLabel,
  data,
  color,
}: KpiSparkCardProps) {
  return (
    <Card className="min-w-0">
      <CardContent className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-foreground m-0 truncate text-base font-semibold">
            {title}
          </h3>
          <p className="text-muted-foreground m-0 truncate text-sm">{metric}</p>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 text-center">
            <div className="text-foreground truncate text-lg font-semibold tabular-nums">
              {baseValue}
            </div>
            <div className="text-muted-foreground truncate text-xs font-medium">
              {baseLabel}
            </div>
          </div>

          <div className="relative mx-2 h-14 min-w-0 flex-1 sm:mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <YAxis domain={["dataMin", "dataMax"]} hide />
                <ReferenceLine
                  y={0}
                  stroke="var(--input)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <Tooltip
                  cursor={{
                    stroke: color,
                    strokeWidth: 1,
                    strokeDasharray: "2 2",
                  }}
                  offset={10}
                  allowEscapeViewBox={{ x: true, y: true }}
                  content={({ active, payload, coordinate }) => {
                    if (!active || !payload?.length || !coordinate) return null

                    const tooltipStyle: React.CSSProperties = {
                      transform:
                        coordinate.x && coordinate.x > 120
                          ? "translateX(-100%)"
                          : "translateX(10px)",
                      marginTop:
                        coordinate.y && coordinate.y > 30 ? "-40px" : "10px",
                    }

                    return (
                      <div
                        className="bg-background/95 border-border pointer-events-none z-50 rounded-lg border p-2.5 shadow-xl backdrop-blur-sm"
                        style={tooltipStyle}
                      >
                        <p className="text-foreground mb-1.5 text-sm leading-tight font-semibold tabular-nums">
                          {formatMoney(Number(payload[0]?.value ?? 0))}
                        </p>
                        <p className="text-muted-foreground text-xs leading-tight">
                          {title}
                        </p>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 0, strokeWidth: 0 }}
                  activeDot={{
                    r: 5,
                    fill: color,
                    stroke: "white",
                    strokeWidth: 2,
                    filter: `drop-shadow(0 0 6px ${color})`,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="min-w-0 text-center">
            <div className="text-foreground truncate text-lg font-semibold tabular-nums">
              {targetValue}
            </div>
            <div className="text-muted-foreground truncate text-xs font-medium">
              {targetLabel}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
