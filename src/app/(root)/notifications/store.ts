import { create } from "zustand"

import kyInstance from "@/lib/ky"
import { tryCatch } from "@/hooks/try-catch"

interface NotificationState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  getUnreadCount: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  getUnreadCount: async () => {
    const { data: result } = await tryCatch(
      kyInstance.get("/api/user/notifications/unread-count").json<number>()
    )
    if (result !== null) {
      set({ unreadCount: result })
    }
  },
}))
