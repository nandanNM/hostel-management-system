"use client"

import { useEffect, useRef, useState } from "react"
import { PushPermissionDeniedError } from "@/helpers/pushService"
import { registerServiceWorker } from "@/helpers/serviceWorker"
import { BellRinging } from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"

import { fireConfetti } from "@/lib/confetti"
import { haptic } from "@/lib/haptic"
import { toast } from "@/lib/toast"
import {
  useDismissPushPrompt,
  usePushPromptState,
  useTogglePushNotifications,
} from "@/hooks/use-push-notifications"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader } from "@/components/ui/loader"
import NotificationBlockedHelp from "@/components/NotificationBlockedHelp"

export default function PushPromptDialog() {
  const { data } = usePushPromptState()
  const { mutate: enablePush, isPending: isEnabling } =
    useTogglePushNotifications()
  const { mutate: dismiss } = useDismissPushPrompt()

  const [open, setOpen] = useState(false)
  const [blocked, setBlocked] = useState(false)
  // Tracks whether the dialog is closing because of a real button choice
  // (Enable/Skip) rather than the X, an outside click, or Escape — those
  // count as "totally ignored it" and should stop the prompt for good.
  const explicitActionRef = useRef(false)

  const queryClient = useQueryClient()

  useEffect(() => {
    registerServiceWorker()
      // Whether this device is subscribed can only be read once the worker is
      // active, and the first read races that. Ask again now that it is.
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ["push-prompt-state"] })
      )
      .catch((err) => console.error("Service worker registration failed:", err))
  }, [queryClient])

  useEffect(() => {
    if (data?.shouldPrompt) {
      explicitActionRef.current = false
      setBlocked(false)
      setOpen(true)
    }
  }, [data?.shouldPrompt])

  function handleOpenChange(next: boolean) {
    if (!next && !explicitActionRef.current) {
      dismiss("skip")
    }
    setOpen(next)
  }

  function handleEnable() {
    explicitActionRef.current = true
    enablePush(true, {
      onSuccess: () => {
        fireConfetti()
        haptic()
        toast.success("Push notifications enabled.")
        setOpen(false)
      },
      onError: (error) => {
        explicitActionRef.current = false
        if (error instanceof PushPermissionDeniedError) {
          setBlocked(true)
          return
        }
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't enable push notifications."
        )
      },
    })
  }

  function handleSkip() {
    explicitActionRef.current = true
    dismiss("remind-later")
    setOpen(false)
  }

  if (blocked) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifications are blocked</DialogTitle>
            <DialogDescription>
              Your browser won&apos;t show the permission prompt again on its
              own. Follow these steps to allow it manually, then come back and
              try again.
            </DialogDescription>
          </DialogHeader>
          <NotificationBlockedHelp />
          <DialogFooter>
            <Button
              onClick={() => {
                explicitActionRef.current = true
                setOpen(false)
              }}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="bg-primary/10 text-primary mb-2 inline-flex size-10 items-center justify-center rounded-full">
            <BellRinging size={20} weight="fill" />
          </div>
          <DialogTitle>Stay in the loop</DialogTitle>
          <DialogDescription>
            Turn on push notifications to get notified the moment your guest
            meal is approved, today&apos;s meal count is generated, or a bill or
            payment hits your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleSkip} disabled={isEnabling}>
            Skip for now
          </Button>
          <Button onClick={handleEnable} disabled={isEnabling}>
            {isEnabling ? (
              <>
                <Loader variant="spinner" size={16} className="mr-2" />
                Enabling...
              </>
            ) : (
              "Enable notifications"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
