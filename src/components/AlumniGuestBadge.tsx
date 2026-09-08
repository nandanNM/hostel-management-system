import { GraduationCap } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/**
 * Marks a guest meal booked for an alumnus.
 *
 * One component for every surface that lists guest meals - the requester's own
 * table, the history, the manager and prefect logs, the pending approval cards
 * and a boarder's detail page - so an alumni booking reads the same wherever
 * it turns up, and the reason a charge is lower is always on screen next to it.
 */
export function AlumniGuestBadge({
  className,
  showLabel = true,
}: {
  className?: string
  /** Off in a dense table cell, where the cap alone carries it. */
  showLabel?: boolean
}) {
  return (
    <Badge
      variant="outline"
      title="Booked for an alumnus, at the alumni rate"
      className={cn(
        "border-primary/30 text-primary gap-1 px-1.5 font-normal",
        className
      )}
    >
      <GraduationCap weight="duotone" aria-hidden />
      {showLabel ? "Alumni" : <span className="sr-only">Alumni</span>}
    </Badge>
  )
}
