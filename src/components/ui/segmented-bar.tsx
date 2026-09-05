import { cn } from "@/lib/utils"

export interface BarSegment {
  key: string
  label: string
  value: number
  /** Tailwind background class for the segment and its legend dot. */
  className?: string
}

interface SegmentedBarProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  segments: BarSegment[]
  /**
   * Denominator for the percentages. Defaults to the sum of the segments, so
   * the bar fills completely; pass an explicit total to leave a remainder.
   */
  total?: number
  /** Percentage callouts above each segment, as on a budget breakdown. */
  showTicks?: boolean
  /** Renders each value next to its legend entry. */
  formatValue?: (value: number) => string
  emptyLabel?: string
}

const FALLBACK_COLORS = [
  "bg-muted-foreground/70",
  "bg-muted-foreground/50",
  "bg-muted-foreground/30",
  "bg-muted-foreground/20",
]

function SegmentedBar({
  segments,
  total,
  showTicks = true,
  formatValue,
  emptyLabel = "Nothing to show yet.",
  className,
  ...props
}: SegmentedBarProps) {
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0)
  const denominator = total ?? sum

  if (denominator <= 0 || segments.length === 0) {
    return (
      <div
        data-slot="segmented-bar"
        className={cn("space-y-3", className)}
        {...props}
      >
        <div className="bg-muted h-2.5 w-full rounded-full" />
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      </div>
    )
  }

  // Empty segments are dropped rather than rendered at zero width, which would
  // otherwise leave a stray flex gap where the bar should be continuous.
  const parts = segments
    .map((segment, index) => ({
      ...segment,
      color:
        segment.className ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      percent: (segment.value / denominator) * 100,
    }))
    .filter((part) => part.percent > 0)

  return (
    <div
      data-slot="segmented-bar"
      className={cn("space-y-2", className)}
      {...props}
    >
      {showTicks && (
        <div className="flex w-full gap-1">
          {parts.map((part) => (
            <div
              key={part.key}
              className="min-w-0"
              style={{ width: `${part.percent}%` }}
            >
              <span className="text-muted-foreground block truncate text-xs tabular-nums">
                {Math.round(part.percent)}%
              </span>
              <span className="bg-border block h-2 w-px" />
            </div>
          ))}
        </div>
      )}

      <div className="flex w-full gap-1">
        {parts.map((part) => (
          <div
            key={part.key}
            className={cn("h-2.5 rounded-full", part.color)}
            style={{ width: `${part.percent}%` }}
            role="presentation"
          />
        ))}
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1.5">
        {parts.map((part) => (
          <li
            key={part.key}
            className="text-muted-foreground flex items-center gap-1.5 text-xs"
          >
            <span
              className={cn("size-2 shrink-0 rounded-full", part.color)}
              aria-hidden
            />
            <span>{part.label}</span>
            {formatValue && (
              <span className="text-foreground font-medium tabular-nums">
                {formatValue(part.value)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export { SegmentedBar }
