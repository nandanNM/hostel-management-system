"use client"

import { useEffect } from "react"
import { RiLoader3Fill } from "@remixicon/react"
import { useQuery } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { toast } from "sonner"

import { GetNotificationWithIssuer } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"

import Notification from "./_components/notification"
import { useMarkNotificationsAsRead } from "./_lib/mutations"

export default function NotificationsList() {
  const { mutate: markAsRead } = useMarkNotificationsAsRead()
  const {
    data: notifications,
    isLoading: isPending,
    error,
    isError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      kyInstance
        .get("/api/user/notifications")
        .json<GetNotificationWithIssuer[]>(),
  })

  useEffect(() => {
    markAsRead()
  }, [markAsRead])

  if (isPending) {
    return <RiLoader3Fill size={30} className="mx-auto my-10 animate-spin" />
  }
  if (isError && error) {
    toast.error(error.message)
  }
  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Header */}
      <div className="bg-card flex items-center justify-between rounded-t-lg border-b p-6">
        <div className="flex items-center gap-3">
          <Bell className="text-primary size-6" />
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground text-sm">
              Stay updated with hostel activities
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card space-y-4 rounded-b-lg border border-t-0 p-6">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <Notification key={notification.id} notification={notification} />
          ))
        ) : (
          <div className="py-12 text-center">
            <Bell className="text-muted-foreground mx-auto mb-4 size-12" />
            <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
            <p className="text-muted-foreground">
              You&apos;re all caught up! Check back later for updates.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
