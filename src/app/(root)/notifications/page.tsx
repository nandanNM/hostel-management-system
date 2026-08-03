"use client"

import { Bell, Check } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { GetNotificationWithIssuer } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { PageContainer } from "@/components/page-container"

import Notification from "./_components/notification"
import { useMarkNotificationsAsRead } from "./_lib/mutations"

export default function NotificationsList() {
  const { mutate: markAllRead, isPending: isMarking } =
    useMarkNotificationsAsRead()
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

  if (isPending) {
    return <Loader variant="spinner" size={24} className="mx-auto my-6" />
  }
  if (isError && error) {
    toast.error(error.message)
  }

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <PageContainer className="space-y-0">
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-t-lg border-b p-6">
        <div className="flex items-center gap-3">
          <Bell className="text-primary size-6" />
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground text-sm">
              Stay updated with hostel activities
            </p>
          </div>
        </div>
        {unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isMarking}
          >
            {isMarking ? (
              <Loader variant="spinner" size={14} className="mr-1" />
            ) : (
              <Check className="mr-1 size-4" />
            )}
            Mark all as read
          </Button>
        ) : null}
      </div>

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
    </PageContainer>
  )
}
