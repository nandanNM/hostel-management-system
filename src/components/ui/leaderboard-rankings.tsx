"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export interface LeaderboardRankingItem {
  userId: string
  rank: number
  userName: string
  /** Supporting line under the name, e.g. "Room 12". */
  byline?: string
  value: number
  /** Set to false to keep a row out of the list. Defaults to shown. */
  displayed?: boolean
  /** Optional avatar; falls back to initials when absent. */
  avatarUrl?: string | null
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "B"
  )
}

function formatValue(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

interface LeaderboardRankingsProps extends React.ComponentProps<"div"> {
  rankings: LeaderboardRankingItem[]
  /** Highlights this row as "you". */
  currentUserId?: string
  showPagination?: boolean
  defaultPageSize?: number
  emptyLabel?: string
}

function LeaderboardRankings({
  rankings,
  currentUserId,
  showPagination = false,
  defaultPageSize = 10,
  emptyLabel = "Nothing to rank yet.",
  className,
  ...props
}: LeaderboardRankingsProps) {
  const [page, setPage] = React.useState(0)

  const rows = rankings.filter((entry) => entry.displayed !== false)
  const pageSize = showPagination ? defaultPageSize : rows.length
  const pageCount = Math.max(1, Math.ceil(rows.length / (pageSize || 1)))
  // Clamp rather than keep a page that no longer exists once the list shrinks.
  const safePage = Math.min(page, pageCount - 1)
  const visible = showPagination
    ? rows.slice(safePage * pageSize, safePage * pageSize + pageSize)
    : rows

  if (rows.length === 0) {
    return <p className="text-muted-foreground py-2 text-sm">{emptyLabel}</p>
  }

  return (
    <div
      data-slot="leaderboard-rankings"
      className={cn("space-y-1", className)}
      {...props}
    >
      <ul className="divide-border divide-y">
        {visible.map((entry) => {
          const isCurrentUser = Boolean(
            currentUserId && entry.userId === currentUserId
          )

          return (
            <li
              key={entry.userId}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2.5",
                isCurrentUser && "bg-accent"
              )}
            >
              <span className="text-muted-foreground w-5 shrink-0 text-right text-xs font-semibold tabular-nums">
                {entry.rank}
              </span>
              <Avatar className="size-8 shrink-0">
                <AvatarImage
                  src={entry.avatarUrl ?? undefined}
                  alt={entry.userName}
                />
                <AvatarFallback>{initials(entry.userName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {entry.userName}
                  {isCurrentUser && (
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      (you)
                    </span>
                  )}
                </p>
                {entry.byline && (
                  <p className="text-muted-foreground truncate text-xs">
                    {entry.byline}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatValue(entry.value)}
              </span>
            </li>
          )
        })}
      </ul>

      {showPagination && pageCount > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-muted-foreground text-xs tabular-nums">
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { LeaderboardRankings }
