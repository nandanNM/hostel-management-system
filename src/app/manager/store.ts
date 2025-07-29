import { DailyMealActivity, GuestMeal } from "@/generated/prisma"
import { toast } from "sonner"
import { create } from "zustand"

import kyInstance from "@/lib/ky"
import { getErrorMessage } from "@/lib/utils"
import { tryCatch } from "@/hooks/try-catch"

import { approveGuestMealRequest, declineGuestMealRequest } from "./action"

interface MealStore {
  getMealData: () => Promise<void>
  mealData: DailyMealActivity | null
  loading: boolean
  setMealData: (data: DailyMealActivity) => void
  clearMealData: () => void
  error: string | null
  guestRequests: GuestMeal[] | []
  errorOnGetGuestRequests: string | null
  approveGuestRequest: (requestId: string) => Promise<void>
  declineGuestRequest: (requestId: string) => Promise<void>
  getGuestMealRequests: () => Promise<void>
}

export const useMealStore = create<MealStore>((set) => ({
  mealData: null,
  loading: true,
  error: null,
  guestRequests: [],
  errorOnGetGuestRequests: null,
  getMealData: async (force = false) => {
    const state = useMealStore.getState()

    if (state.mealData && !force) return

    set({ loading: true, error: null })

    const { data: result, error } = await tryCatch(
      kyInstance.get("/api/manager/meal").json<DailyMealActivity>()
    )

    if (error) {
      toast.error(error.message || "Failed to fetch meal data.")
      set({ error: error.message || "Unknown error occurred." })
    } else if (result) {
      set({ mealData: result })
      toast.success("Successfully fetched today's meal data.")
    }

    set({ loading: false })
  },

  setMealData: (data) => set({ mealData: data }),
  clearMealData: () => set({ mealData: null }),

  getGuestMealRequests: async () => {
    const { data: result, error } = await tryCatch(
      kyInstance
        .get("/api/manager/meal/panding-gurst-meals")
        .json<GuestMeal[]>()
    )
    if (!error && result) {
      set({ guestRequests: result, errorOnGetGuestRequests: null })
    }
    if (error) {
      const message = await getErrorMessage(error)
      set({ errorOnGetGuestRequests: message })
    }
  },
  approveGuestRequest: async (requestId) => {
    toast.promise(approveGuestMealRequest(requestId), {
      loading: "Approving guest meal request...",
      success: "Guest meal request approved successfully",
      error: (err) =>
        `Error: ${err.message || "An unexpected error occurred. Please try again later."}`,
    })
  },

  declineGuestRequest: async (requestId) => {
    toast.promise(declineGuestMealRequest(requestId), {
      loading: "Declining guest meal request...",
      success: "Guest meal request declined successfully",
      error: (err) =>
        `Error: ${err.message || "An unexpected error occurred. Please try again later."}`,
    })
  },
}))
