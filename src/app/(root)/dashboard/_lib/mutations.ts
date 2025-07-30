import { MealStatusType } from "@/generated/prisma"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { toggleMealStatus } from "./action"

export function useToggleMealStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (newStatus: MealStatusType) => toggleMealStatus(newStatus),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ["meal", "status"] })
      const previousData = queryClient.getQueryData(["meal", "status"])
      queryClient.setQueryData(["meal", "status"], { status: newStatus })
      return { previousData }
    },

    onError: (error, newStatus, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["meal", "status"], context.previousData)
      }
      toast.error("Failed to update meal status.")
    },

    onSuccess: (result, newStatus) => {
      if (result.status === "success") {
        toast.success(
          `Meal status turned ${newStatus === "ACTIVE" ? "ON" : "OFF"}.`
        )
      } else if (result.status === "error") {
        toast.error(result.message)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["meal", "status"] })
    },
  })
}
