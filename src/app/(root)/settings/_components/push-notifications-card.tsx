"use client"

import { useState } from "react"
import { PushPermissionDeniedError } from "@/helpers/pushService"
import { Bell } from "@phosphor-icons/react"

import { toast } from "@/lib/toast"
import {
  usePushPromptState,
  useTogglePushNotifications,
} from "@/hooks/use-push-notifications"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader } from "@/components/ui/loader"
import { Switch } from "@/components/ui/switch"
import NotificationBlockedHelp from "@/components/NotificationBlockedHelp"

export default function PushNotificationsCard() {
  const { data, isLoading } = usePushPromptState()
  const { mutate: toggle, isPending } = useTogglePushNotifications()
  const [showBlockedHelp, setShowBlockedHelp] = useState(false)

  const enabled = data?.pushEnabled ?? false
  const unsupported =
    typeof window !== "undefined" && !("PushManager" in window)

  function handleChange(next: boolean) {
    toggle(next, {
      onSuccess: () => {
        toast.success(
          next
            ? "Push notifications enabled on this device."
            : "Push notifications turned off on this device."
        )
      },
      onError: (error) => {
        if (error instanceof PushPermissionDeniedError) {
          setShowBlockedHelp(true)
          return
        }
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't update push notifications."
        )
      },
    })
  }

  return (
    <>
      <Card className="w-full max-w-2xl border-none bg-transparent shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold">
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get notified on this device the moment something needs your
            attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="bg-sidebar flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary rounded-full p-2">
                <Bell size={18} weight="fill" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Meal, bill &amp; approval alerts
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  We&apos;ll send you a push notification when today&apos;s meal
                  count is generated, your guest meal request is approved, a
                  monthly bill is issued, or a payment/due is recorded on your
                  account. You can turn this off anytime.
                </p>
                {unsupported && (
                  <p className="text-destructive mt-2 text-xs">
                    Your browser doesn&apos;t support push notifications.
                  </p>
                )}
              </div>
            </div>
            {isLoading ? (
              <Loader variant="spinner" size={16} />
            ) : (
              <Switch
                checked={enabled}
                disabled={isPending || unsupported}
                onCheckedChange={handleChange}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showBlockedHelp} onOpenChange={setShowBlockedHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifications are blocked</DialogTitle>
            <DialogDescription>
              Your browser won&apos;t show the permission prompt again on its
              own. Follow these steps to allow it manually, then come back and
              flip the toggle.
            </DialogDescription>
          </DialogHeader>
          <NotificationBlockedHelp />
        </DialogContent>
      </Dialog>
    </>
  )
}
