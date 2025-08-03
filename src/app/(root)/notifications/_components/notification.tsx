import type { JSX } from "react" // Import JSX to fix the lint error
import Link from "next/link"
import { NotificationType } from "@/generated/prisma"
import {
  AlertTriangle,
  Clock,
  CreditCard,
  Megaphone,
  Settings2,
  UtensilsCrossed,
} from "lucide-react"

import { GetNotificationWithIssuer } from "@/types/prisma.type"
import { cn, formatRelativeDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import UserAvatar from "@/components/UserAvatar"

interface NotificationProps {
  notification: GetNotificationWithIssuer
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    {
      icon: JSX.Element
      bgColor: string
      iconColor: string
      badge: string
      href: string
    }
  > = {
    PAYMENT: {
      icon: <CreditCard className="size-6" />,
      bgColor: "bg-green-50 dark:bg-green-950/20",
      iconColor: "text-green-600 bg-green-100 dark:bg-green-900/30",
      badge: "Payment",
      href: "/payments",
    },
    MEAL: {
      icon: <UtensilsCrossed className="size-6" />,
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      iconColor: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
      badge: "Meal",
      href: "/meals",
    },
    FINE: {
      icon: <AlertTriangle className="size-6" />,
      bgColor: "bg-red-50 dark:bg-red-950/20",
      iconColor: "text-red-600 bg-red-100 dark:bg-red-900/30",
      badge: "Fine",
      href: "/fines",
    },
    ANNOUNCEMENT: {
      icon: <Megaphone className="size-6" />,
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      iconColor: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
      badge: "Announcement",
      href: "/announcements",
    },
    SYSTEM: {
      icon: <Settings2 className="size-6" />,
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      iconColor: "text-gray-600 bg-gray-100 dark:bg-gray-900/30",
      badge: "System",
      href: "/system",
    },
  }

  const { icon, bgColor, iconColor, badge, href } =
    notificationTypeMap[notification.type]

  return (
    <Link href={href} className="block">
      <article
        className={cn(
          "group bg-card relative flex gap-4 rounded-xl border p-4 shadow-sm",
          !notification.read && "border-l-primary bg-primary/5 border-l-4",
          notification.read && "bg-muted/30 border-muted opacity-60",
          bgColor
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            iconColor
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {badge}
              </Badge>
              {!notification.read && (
                <div className="bg-primary size-2 rounded-full" />
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Clock className="size-3" />
              {formatRelativeDate(notification.createdAt)}
            </div>
          </div>

          <div className="space-y-1">
            <h4
              className={cn(
                "font-semibold",
                notification.read ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {notification.title}
            </h4>
            <p
              className={cn(
                "text-sm leading-relaxed",
                notification.read
                  ? "text-muted-foreground/70"
                  : "text-muted-foreground"
              )}
            >
              {notification.message}
            </p>
          </div>

          {/* Issuer info */}
          <div className="flex items-center gap-2 pt-1">
            <UserAvatar
              avatarUrl={notification.issuer.image}
              size={24}
              className="border-background border-2"
            />
            <span className="text-muted-foreground text-xs">
              From {notification.issuer.name}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
