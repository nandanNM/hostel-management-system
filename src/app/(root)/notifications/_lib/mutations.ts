import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import kyInstance from "@/lib/ky"

export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => kyInstance.patch("/api/user/notifications/mark-as-read"),
    onSuccess: () => {
      queryClient.setQueryData(["notifications", "unread-count"], 0)
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: () => {
      toast.error("Failed to mark notifications as read")
    },
  })
}
