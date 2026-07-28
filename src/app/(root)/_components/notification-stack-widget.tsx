"use client"

import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { GetNotificationWithIssuer } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { formatRelativeDate } from "@/lib/utils"
import {
  NotificationStack,
  type NotificationStackItem,
} from "@/components/ui/notification-stack"

export function NotificationStackWidget() {
  const router = useRouter()

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      kyInstance
        .get("/api/user/notifications")
        .json<GetNotificationWithIssuer[]>(),
    refetchOnWindowFocus: false,
  })

  if (!data || data.length === 0) return null

  const items: NotificationStackItem[] = data.slice(0, 5).map((n) => ({
    id: n.id,
    title: n.title,
    description: n.message,
    trailing: formatRelativeDate(new Date(n.createdAt)),
  }))

  return (
    <div className="flex justify-center sm:justify-start">
      <NotificationStack
        items={items}
        onViewAll={() => router.push("/notifications")}
        collapsedLabel="Notifications"
        expandedLabel="View all"
      />
    </div>
  )
}
