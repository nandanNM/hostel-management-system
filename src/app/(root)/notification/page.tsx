"use Client";

import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import kyInstance from "@/lib/ky";
import { GetNotificationWithIssuer } from "@/types/prisma.type";
import { RiLoader3Fill } from "@remixicon/react";
import { Bell, Check, Filter } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import Notification from "./_components/notification";

export default function NotificationsList() {
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<
    GetNotificationWithIssuer[]
  >([]);
  useEffect(() => {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        kyInstance
          .get("/api/user/notification")
          .json<GetNotificationWithIssuer[]>(),
      );

      if (error) {
        toast.error(
          error.name === "TimeoutError"
            ? "Request timed out. Please try again."
            : "An unexpected error occurred. Please try again later.",
        );
        return;
      }
      setNotifications(result ?? []);
    });
  }, []);

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
        <div className="flex items-center gap-2">
          {/* {unreadCount > 0 && (
            <Badge variant="destructive" className="px-2 py-1">
              {unreadCount} new
            </Badge>
          )} */}
          <Button variant="outline" size="sm">
            <Check className="mr-2 size-4" />
            Mark all read
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="size-4" />
          </Button>
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
