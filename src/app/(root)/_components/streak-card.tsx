"use client"

import { Fire } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import kyInstance from "@/lib/ky"
import { Card } from "@/components/ui/card"

type StreakData = {
  streak: number
  monthMeals: number
}

export function StreakCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["streak", "me"],
    queryFn: () => kyInstance.get("/api/user/streak").json<StreakData>(),
    refetchOnWindowFocus: false,
  })

  const streak = data?.streak ?? 0

  return (
    <Card className="relative min-h-44 overflow-hidden border-0 bg-neutral-900 p-0">
      <video
        src="/firstbox.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-br from-orange-950/85 via-black/60 to-black/25" />
      <div className="relative flex h-full min-h-44 flex-col justify-between gap-4 p-6 text-white">
        <div className="flex items-center gap-2 text-sm font-medium text-white/90">
          <Fire weight="fill" className="size-4 text-orange-400" />
          Your meal streak
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl leading-none font-extrabold tabular-nums drop-shadow-sm">
              {isLoading ? "—" : streak}
            </span>
            <span className="text-xl font-semibold text-orange-300">
              {streak === 1 ? "day" : "days"} 🔥
            </span>
          </div>
          <p className="mt-2 text-sm text-white/80">
            {streak === 0
              ? "Turn your meals on and start a streak today!"
              : `${data?.monthMeals ?? 0} meals this month. Keep the fire going!`}
          </p>
        </div>
      </div>
    </Card>
  )
}
