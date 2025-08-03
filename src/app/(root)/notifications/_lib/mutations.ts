import { useMutation, useQueryClient } from "@tanstack/react-query"

import kyInstance from "@/lib/ky"

export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => kyInstance.patch("/api/user/notifications/mark-as-read"),
    onSuccess: () => {
      queryClient.setQueryData(["notifications", "unread-count"], 0)
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: () => {},
  })
}
