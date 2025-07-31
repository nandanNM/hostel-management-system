import { GuestMeal } from "@/generated/prisma"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { GuestMeal as GuestMealValidation } from "@/lib/validations"

import { createGuestMeal, deleteGuestMealRequest } from "./action"

export function useDeleteGuestMealRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteGuestMealRequest(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["guest-meals", "pending"] })
      const previousRequests = queryClient.getQueryData<GuestMeal[]>([
        "guest-meals",
        "pending",
      ])
      if (previousRequests) {
        queryClient.setQueryData<GuestMeal[]>(
          ["guest-meals", "pending"],
          previousRequests.filter((request) => request.id !== deletedId)
        )
      }
      return { previousRequests }
    },
    onError: (error, deletedId, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(
          ["guest-meals", "pending"],
          context.previousRequests
        )
      }
      toast.error("An unexpected error occurred. Please try again later.")
    },
    onSuccess: (result) => {
      if (result.status === "success") {
        toast.success(result.message)
      } else if (result.status === "error") {
        toast.error(result.message)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-meals", "pending"] })
    },
  })
}

export function useCreateGuestMeal(onOpenChange?: (open: boolean) => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GuestMealValidation) => createGuestMeal(data),
    onSuccess: (result) => {
      if (result.status === "success") {
        onOpenChange?.(false)
        toast.success("Guest meal request created successfully.")
        queryClient.invalidateQueries({ queryKey: ["guest-meals", "pending"] })
      } else if (result.status === "error") {
        toast.error(result.message)
      }
    },
    onError: () => {
      toast.error("Failed to create guest meal request.")
    },
  })
}
