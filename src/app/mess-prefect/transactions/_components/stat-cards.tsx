import { TrendDown, TrendUp } from "@phosphor-icons/react/ssr"

import { cn } from "@/lib/utils"

interface RangeStatProps {
  label: string
  value: string
  /** Percent change vs the previous window; `null` when there is no baseline. */
  delta: number | null
  className?: string
}

export function RangeStat({ label, value, delta, className }: RangeStatProps) {
  const isUp = (delta ?? 0) >= 0
  const TrendIcon = isUp ? TrendUp : TrendDown

  return (
    <div className={cn("min-w-0 px-4 py-3", className)}>
      <p className="text-muted-foreground truncate text-xs font-medium">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      {delta === null ? (
        <p className="text-muted-foreground mt-1 text-[11px]">
          No prior period
        </p>
      ) : (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-[11px] font-medium",
            isUp
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          <TrendIcon className="size-3.5 shrink-0" weight="bold" />
          {isUp ? "+" : "−"}
          {Math.abs(delta).toFixed(1)}%
          <span className="text-muted-foreground font-normal">vs prior</span>
        </p>
      )}
    </div>
  )
}
