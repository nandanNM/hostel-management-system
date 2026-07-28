"use client"

import { Trophy } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import kyInstance from "@/lib/ky"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import UserAvatar from "@/components/UserAvatar"

type Leader = {
  rank: number
  id: string
  name: string | null
  image: string | null
  count: number
  isYou: boolean
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

export function LeaderboardCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", "month"],
    queryFn: () => kyInstance.get("/api/user/leaderboard").json<Leader[]>(),
    refetchOnWindowFocus: false,
  })

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-5 text-amber-500" weight="fill" />
          PG1 ka Bhukkad
          <span className="text-muted-foreground text-xs font-normal">
            · this month
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader variant="dither" size={22} />
        ) : !data || data.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No meals recorded yet this month.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {data.map((leader) => (
              <li
                key={leader.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  leader.isYou ? "bg-primary/10" : "hover:bg-muted/60"
                )}
              >
                <span className="flex w-7 shrink-0 justify-center text-lg">
                  {MEDALS[leader.rank] ?? (
                    <span className="text-muted-foreground text-sm font-semibold tabular-nums">
                      {leader.rank}
                    </span>
                  )}
                </span>
                <UserAvatar
                  avatarUrl={leader.image}
                  size={36}
                  className="size-9"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {leader.name ?? "Boarder"}
                  {leader.isYou && (
                    <span className="text-primary ml-1 text-xs">(you)</span>
                  )}
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="text-base font-bold tabular-nums">
                    {leader.count}
                  </span>
                  <span className="text-muted-foreground text-xs">meals</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
