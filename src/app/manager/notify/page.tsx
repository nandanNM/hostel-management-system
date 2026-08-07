import { Metadata } from "next"
import { Megaphone } from "@phosphor-icons/react/ssr"

import { BroadcastNotificationForm } from "./_components/broadcast-notification-form"

export const metadata: Metadata = {
  title: "Send Notification | Manager",
}

export default function NotifyPage() {
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Send Notification
          </h1>
          <p className="text-muted-foreground mt-1">
            Broadcast a push notification to every active boarder.
          </p>
        </div>
      </div>

      <BroadcastNotificationForm />
    </div>
  )
}
