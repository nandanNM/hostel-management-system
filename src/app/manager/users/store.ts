import { MealStatusType } from "@/generated/prisma"
import { toast } from "sonner"
import { create } from "zustand"

import { GetMealWithUser } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { getErrorMessage } from "@/lib/utils"
import { tryCatch } from "@/hooks/try-catch"

import { updateUserMealStatus } from "./action"

interface MealStore {
  meals: GetMealWithUser[]
  loading: boolean
  error: string | null
  fetchMeals: () => Promise<void>
  updateMealStatus: (mealId: string, status: MealStatusType) => Promise<void>
}

export const useUserMealListStore = create<MealStore>((set) => ({
  meals: [],
  loading: true,
  error: null,

  fetchMeals: async () => {
    set({ loading: true, error: null })
    const { data: result, error } = await tryCatch(
      kyInstance.get("/api/manager/user-meals").json<GetMealWithUser[]>()
    )

    if (error) {
      toast.error(
        (await getErrorMessage(error.message)) || "Failed to fetch meal data."
      )
      set({
        error:
          (await getErrorMessage(error.message)) || "Unknown error occurred.",
      })
    } else if (result) {
      set({ meals: result })
      toast.success("Successfully fetched today's meal data.")
    }

    set({ loading: false })
  },

  updateMealStatus: async (mealId, status: MealStatusType) => {
    toast.promise(
      (async () => {
        await updateUserMealStatus(mealId, status)
        set((state) => ({
          meals: state.meals.map((meal) =>
            meal.id === mealId ? { ...meal, status } : meal
          ),
        }))
      })(),
      {
        loading: "Updating user meal status...",
        success: {
          message: "User meal status updated successfully",
        },
        error: (err) =>
          `Error: ${err.message || "An unexpected error occurred. Please try again later."}`,
      }
    )
  },
}))
