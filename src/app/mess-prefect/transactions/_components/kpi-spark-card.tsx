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
  // Read at hover time rather than tracked in state: the tooltip needs the
  // chart's current width to know which side to open on, and that width now
  // changes with the card's layout, not just the viewport.
  const chartRef = React.useRef<HTMLDivElement>(null)

  return (
    <Card className="@container/spark min-w-0">
      <CardContent className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-foreground m-0 truncate text-base font-semibold">
            {title}
          </h3>
          <p className="text-muted-foreground m-0 truncate text-sm">{metric}</p>
        </div>

        {/* Under ~24rem of card there is no room for figure | chart | figure:
            both amounts truncate to "₹2,17,2…" and the chart is squeezed to a
            sliver. Narrower than that, the chart drops to its own full-width
            row under the two amounts.

            Keyed to the card, not the viewport — the same card is roomy two-up
            on a wide screen and cramped four-up at xl, so a media query would
            have to guess which of those it was in. */}
        <div className="flex min-w-0 flex-col gap-4 @[24rem]/spark:flex-row @[24rem]/spark:items-center @[24rem]/spark:justify-between @[24rem]/spark:gap-2">
          {/* Dissolves once there is room, so the two amounts become direct
              children of the row above and `order` can sit them either side of
              the chart. */}
          <div className="flex min-w-0 items-start justify-between gap-3 @[24rem]/spark:contents">
            <div className="min-w-0 @[24rem]/spark:order-1 @[24rem]/spark:text-center">
              <div className="text-foreground truncate text-lg font-semibold tabular-nums">
                {baseValue}
              </div>
              <div className="text-muted-foreground truncate text-xs font-medium">
                {baseLabel}
              </div>
            </div>

            <div className="min-w-0 text-right @[24rem]/spark:order-3 @[24rem]/spark:text-center">
              <div className="text-foreground truncate text-lg font-semibold tabular-nums">
                {targetValue}
              </div>
              <div className="text-muted-foreground truncate text-xs font-medium">
                {targetLabel}
              </div>
            </div>
          </div>

          <div
            ref={chartRef}
            className="relative h-14 w-full min-w-0 @[24rem]/spark:order-2 @[24rem]/spark:mx-4 @[24rem]/spark:w-auto @[24rem]/spark:flex-1"
          >
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

                    // Flip at the chart's own midpoint. A fixed 120px was fine
                    // while the chart was always a narrow middle column; on the
                    // full-width wrapped row it would flip almost immediately
                    // and hang the tooltip off the left edge of the card.
                    const flipAfter = (chartRef.current?.offsetWidth ?? 240) / 2
                    const tooltipStyle: React.CSSProperties = {
                      transform:
                        coordinate.x && coordinate.x > flipAfter
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
        </div>
      </CardContent>
    </Card>
  )
}
