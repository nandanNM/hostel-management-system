"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Bell, BellSlash } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { GetNotificationWithIssuer } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { formatRelativeDate } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function NavNotifications() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      kyInstance
        .get("/api/user/notifications")
        .json<GetNotificationWithIssuer[]>(),
    refetchOnWindowFocus: false,
  })

  const notifications = data ?? []
  const count = notifications.length

  const viewAll = () => {
    setOpen(false)
    router.push("/notifications")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="hover:bg-accent relative grid size-9 place-items-center rounded-full transition-colors"
        >
          <Bell size={20} />
          {count > 0 ? (
            <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-orange-600 text-[10px] font-medium text-white dark:bg-orange-500">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 ? (
            <span className="text-muted-foreground text-xs">{count} new</span>
          ) : null}
        </div>

        {count === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-sm">
            <BellSlash size={22} />
            All caught up
          </div>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto p-2">
            {notifications.slice(0, 6).map((n) => (
              <div
                key={n.id}
                className="hover:bg-muted/60 rounded-xl px-3 py-2.5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-foreground min-w-0 text-sm font-medium">
                    {n.title}
                  </p>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatRelativeDate(new Date(n.createdAt))}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={viewAll}
          className="hover:bg-muted/60 flex w-full items-center justify-center gap-1 border-t px-4 py-2.5 text-sm font-medium transition-colors"
        >
          View all <ArrowUpRight size={14} />
        </button>
      </PopoverContent>
    </Popover>
  )
}
