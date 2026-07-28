import type { JSX } from "react"
import Link from "next/link"
import {
  Warning as AlertTriangle,
  Clock,
  CreditCard,
  Megaphone,
  GearSix as Settings2,
  ForkKnife as UtensilsCrossed,
} from "@phosphor-icons/react/ssr"

import { GetNotificationWithIssuer } from "@/types/prisma.type"
import { NotificationType } from "@/lib/generated/prisma"
import { cn, formatRelativeDate } from "@/lib/utils"
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import UserAvatar from "@/components/UserAvatar"

interface NotificationProps {
  notification: GetNotificationWithIssuer
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    { icon: JSX.Element; iconColor: string; badge: string; href: string }
  > = {
    PAYMENT: {
      icon: <CreditCard className="size-5" />,
      iconColor: "text-green-600 bg-green-100 dark:bg-green-900/30",
      badge: "Payment",
      href: "/payments",
    },
    MEAL: {
      icon: <UtensilsCrossed className="size-5" />,
      iconColor: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
      badge: "Meal",
      href: "/meals",
    },
    FINE: {
      icon: <AlertTriangle className="size-5" />,
      iconColor: "text-red-600 bg-red-100 dark:bg-red-900/30",
      badge: "Fine",
      href: "/fines",
    },
    ANNOUNCEMENT: {
      icon: <Megaphone className="size-5" />,
      iconColor: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
      badge: "Announcement",
      href: "/announcements",
    },
    SYSTEM: {
      icon: <Settings2 className="size-5" />,
      iconColor: "text-gray-600 bg-gray-100 dark:bg-gray-800/40",
      badge: "System",
      href: "/system",
    },
  }

  const { icon, iconColor, badge, href } =
    notificationTypeMap[notification.type]

  return (
    <Link href={href} className="block">
      <Alert
        size="lg"
        layout="complex"
        className={cn(
          "hover:bg-muted/40 transition-colors",
          !notification.read && "border-l-primary bg-primary/5 border-l-4",
          notification.read && "opacity-70"
        )}
        icon={
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full",
              iconColor
            )}
          >
            {icon}
          </div>
        }
        action={
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs whitespace-nowrap">
            <Clock className="size-3.5" />
            {formatRelativeDate(notification.createdAt)}
          </div>
        }
      >
        <AlertContent className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {badge}
            </Badge>
            {!notification.read ? (
              <span className="bg-primary size-2 rounded-full" />
            ) : null}
          </div>
          <AlertTitle className="text-foreground text-base font-semibold">
            {notification.title}
          </AlertTitle>
          <AlertDescription className="leading-relaxed">
            {notification.message}
          </AlertDescription>
          <div className="flex items-center gap-2 pt-1">
            <UserAvatar
              avatarUrl={notification.issuer.image}
              size={20}
              className="border-background border-2"
            />
            <span className="text-muted-foreground text-xs">
              From {notification.issuer.name}
            </span>
          </div>
        </AlertContent>
      </Alert>
    </Link>
  )
}
