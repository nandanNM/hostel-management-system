import * as React from "react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface LeaderboardRanking {
  userId: string
  userName: string
  rank: number
  value: number
  /** Optional avatar; falls back to initials when absent. */
  avatarUrl?: string | null
}

/** Visual order is 2nd, 1st, 3rd — the leader stands in the middle. */
const PODIUM_ORDER = [2, 1, 3] as const

const PLACE_STYLES: Record<
  number,
  { block: string; ring: string; badge: string; height: string }
> = {
  1: {
    block: "bg-amber-500/15",
    ring: "ring-amber-500",
    badge: "bg-amber-500 text-white",
    height: "h-20",
  },
  2: {
    block: "bg-muted",
    ring: "ring-muted-foreground/40",
    badge: "bg-muted-foreground/80 text-background",
    height: "h-14",
  },
  3: {
    block: "bg-orange-800/15",
    ring: "ring-orange-800/50",
    badge: "bg-orange-800/80 text-white",
    height: "h-10",
  },
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

interface LeaderboardPodiumProps extends React.ComponentProps<"div"> {
  rankings: LeaderboardRanking[]
}

function LeaderboardPodium({
  rankings,
  className,
  ...props
}: LeaderboardPodiumProps) {
  const byRank = new Map(rankings.map((entry) => [entry.rank, entry]))
  const places = PODIUM_ORDER.map((place) => byRank.get(place)).filter(
    (entry): entry is LeaderboardRanking => Boolean(entry)
  )

  if (places.length === 0) return null

  return (
    <div
      data-slot="leaderboard-podium"
      className={cn("flex items-end justify-center gap-2 sm:gap-4", className)}
      {...props}
    >
      {places.map((entry) => {
        const style = PLACE_STYLES[entry.rank] ?? PLACE_STYLES[3]!

        return (
          <div
            key={entry.userId}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="relative">
              <Avatar
                className={cn("size-12 ring-2 ring-offset-2", style.ring)}
              >
                <AvatarImage
                  src={entry.avatarUrl ?? undefined}
                  alt={entry.userName}
                />
                <AvatarFallback>{initials(entry.userName)}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                  style.badge
                )}
              >
                {entry.rank}
              </span>
            </div>

            <div className="w-full min-w-0 text-center">
              <p className="truncate text-xs font-medium">{entry.userName}</p>
              <p className="text-muted-foreground truncate text-[11px] tabular-nums">
                {formatValue(entry.value)}
              </p>
            </div>

            <div
              className={cn("w-full rounded-t-lg", style.block, style.height)}
              aria-hidden
            />
          </div>
        )
      })}
    </div>
  )
}

export { LeaderboardPodium }
