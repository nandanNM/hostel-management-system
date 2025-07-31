import { GuestMeal, GuestMealStatusType } from "@/generated/prisma"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { updateGuestMealStatus } from "./action"

type UpdateGuestMealInput = {
  id: string
  status: GuestMealStatusType
}

export function useUpdateGuestMealStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: UpdateGuestMealInput) =>
      updateGuestMealStatus({ requestId: id, status }),

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: ["guest-meals", "manager", "pending"],
      })

      const previousRequests = queryClient.getQueryData<GuestMeal[]>([
        "guest-meals",
        "manager",
        "pending",
      ])

      if (previousRequests) {
        queryClient.setQueryData<GuestMeal[]>(
          ["guest-meals", "manager", "pending"],
          previousRequests.filter((request) => request.id !== id)
        )
      }

      return { previousRequests }
    },

    onError: (error, _variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(
          ["guest-meals", "manager", "pending"],
          context.previousRequests
        )
      }

      toast.error("Failed to update guest meal request.")
      console.error("Mutation error:", error)
    },

    onSuccess: (result, { status }) => {
      if (result.status === "success") {
        toast.success(
          status === "APPROVED"
            ? "Request approved successfully."
            : "Request declined successfully."
        )
      } else {
        toast.error(result.message || "Unexpected error occurred.")
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["guest-meals", "manager", "pending"],
      })
    },
  })
}
