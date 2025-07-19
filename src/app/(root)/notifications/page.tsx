"use client";

import { tryCatch } from "@/hooks/try-catch";
import kyInstance from "@/lib/ky";
import { GetNotificationWithIssuer } from "@/types/prisma.type";
import { RiLoader3Fill } from "@remixicon/react";
import { Bell } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import Notification from "./_components/notification";
import { useNotificationStore } from "./store";

export default function NotificationsList() {
  const [isPending, startTransition] = useTransition();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const [notifications, setNotifications] = useState<
    GetNotificationWithIssuer[]
  >([]);
  useEffect(() => {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        kyInstance
          .get("/api/user/notifications")
          .json<GetNotificationWithIssuer[]>(),
      );

      if (error) {
        toast.error(
          error.message || error.message || error.name === "TimeoutError"
            ? "Request timed out. Please try again."
            : "An unexpected error occurred. Please try again later.",
        );
        return;
      }
      setNotifications(result ?? []);
    });
  }, []);

  useEffect(() => {
    async function makeAsRead() {
      const { data: result } = await tryCatch(
        kyInstance.patch("/api/user/notifications/mark-as-read"),
      );
      if (result) {
        setUnreadCount(0);
      }
    }
    makeAsRead();
  }, [setUnreadCount]);

  if (isPending)
    return <RiLoader3Fill size={30} className="mx-auto my-10 animate-spin" />;
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
        {notifications.length > 0 ? (
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
  );
}
