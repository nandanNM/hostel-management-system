import {
  getCurrentPushSubscription,
  registerPushNotification,
  unregisterPushNotification,
} from "@/helpers/pushService"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import kyInstance from "@/lib/ky"

export type PushPromptState = {
  shouldPrompt: boolean
  /** Whether *this* browser is subscribed, not whether the account is. */
  enabledHere: boolean
  otherDevices: number
  skipped: boolean
  remindAt: string | null
}

/** How long to wait for the service worker before assuming this device is off. */
const SW_READY_TIMEOUT_MS = 3000

/** This browser's own push endpoint, or null if it has never subscribed. */
async function currentEndpoint(): Promise<string | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
    return null

  try {
    // `navigator.serviceWorker.ready` does not settle until a worker is
    // active, which on a first visit happens after this runs - so it must be
    // raced, or the settings toggle spins forever. Reporting "off" early is
    // safe: enabling simply re-registers the subscription the browser holds.
    const subscription = await Promise.race([
      getCurrentPushSubscription(),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS)
      ),
    ])
    return subscription?.endpoint ?? null
  } catch {
    // Push unsupported, or the worker failed - both mean "not on this device".
    return null
  }
}

export function usePushPromptState() {
  return useQuery({
    queryKey: ["push-prompt-state"],
    queryFn: async () => {
      // The endpoint goes with the request: whether push is on is a question
      // about this device, and the server cannot tell devices apart without it.
      const endpoint = await currentEndpoint()
      return kyInstance
        .get("/api/push", {
          searchParams: endpoint ? { endpoint } : undefined,
        })
        .json<PushPromptState>()
    },
    refetchOnWindowFocus: false,
  })
}

export function useTogglePushNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (enabled: boolean) =>
      enabled ? registerPushNotification() : unregisterPushNotification(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-prompt-state"] })
    },
  })
}

export function useDismissPushPrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (action: "skip" | "remind-later") =>
      kyInstance.post("/api/push", {
        json: { action, endpoint: await currentEndpoint() },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-prompt-state"] })
    },
  })
}
