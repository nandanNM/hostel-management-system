"use client"

import { AnimatePresence, motion } from "motion/react"
import { Bar, BarChart, Rectangle, XAxis } from "recharts"

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/evilcharts/ui/recharts-chart"

type MonthlyPoint = {
  month: string
  total: number
}

const chartConfig = {
  total: {
    label: "Billed",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig

function formatMoney(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

export function MonthlyBillChart({ data }: { data: MonthlyPoint[] }) {
  const grandTotal = data.reduce((sum, point) => sum + point.total, 0)
  const topMonth = data.reduce(
    (best, point) => (point.total > best.total ? point : best),
    data[0] ?? { month: "—", total: 0 }
  )

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">
              {"[₹] Total Billed"}
            </span>
            <span className="text-primary font-mono text-3xl">
              <span className="text-muted-foreground text-xl font-normal">
                ₹
              </span>
              <span className="tracking-tighter">
                {formatMoney(grandTotal)}
              </span>
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">
              {"[⬆] Top Month"}
            </span>
            <span className="text-primary font-mono text-3xl">
              <span className="tracking-tighter">{topMonth.month}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// X-AXIS: "}
            <span className="text-primary">MONTHS</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// Y-AXIS: "}
            <span className="text-primary">BILLED</span>
          </span>
        </div>
      </div>
      <hr className="my-4 border-t border-dashed" />
      <div className="h-64 w-full">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto! h-full w-full"
        >
          <BarChart accessibilityLayer data={data} margin={{ top: 24 }}>
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 3)}
            />
            <Bar
              dataKey="total"
              fill="var(--color-total-0)"
              shape={BarShape}
              activeBar={BarShape}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}

interface BarProps {
  index?: number
  value?: number | [number, number]
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  isActive?: boolean
}

const COLLAPSED_SCALE = 0.1

const BarShape = (props: BarProps) => {
  const { fill, x, y, width, height, index, value, isActive } = props

  const xPos = Number(x || 0)
  const yPos = Number(y || 0)
  const realWidth = Number(width || 0)
  const realHeight = Number(height || 0)

  const centerX = xPos + realWidth / 2
  const centerY = yPos + realHeight / 2

  return (
    <>
      <Rectangle {...props} fill="transparent" />

      <AnimatePresence>
        <motion.rect
          key={`bar-${index}`}
          x={xPos}
          y={yPos}
          width={realWidth}
          height={realHeight}
          fill={fill}
          initial={{ scaleX: isActive ? COLLAPSED_SCALE : 1 }}
          animate={{ scaleX: isActive ? 1 : COLLAPSED_SCALE }}
          exit={{ scaleX: COLLAPSED_SCALE }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{
            transformOrigin: `${centerX}px ${centerY}px`,
            transformBox: "fill-box",
          }}
        />
      </AnimatePresence>
      {isActive && (
        <AnimatePresence>
          <motion.text
            className="font-mono"
            key={`text-${index}`}
            initial={{ opacity: 0, y: -10, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
            transition={{ duration: 0.2 }}
            x={centerX}
            y={yPos - 5}
            textAnchor="middle"
            fill={fill}
            style={{ pointerEvents: "none" }}
          >
            {value}
          </motion.text>
        </AnimatePresence>
      )}
    </>
  )
}
