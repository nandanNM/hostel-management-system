import {
  registerPushNotification,
  unregisterPushNotification,
} from "@/helpers/pushService"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import kyInstance from "@/lib/ky"

export type PushPromptState = {
  shouldPrompt: boolean
  pushEnabled: boolean
  skipped: boolean
  remindAt: string | null
}

export function usePushPromptState() {
  return useQuery({
    queryKey: ["push-prompt-state"],
    queryFn: () => kyInstance.get("/api/push").json<PushPromptState>(),
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
    mutationFn: (action: "skip" | "remind-later") =>
      kyInstance.post("/api/push", { json: { action } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-prompt-state"] })
    },
  })
}
