"use client"

import { useId } from "react"
import { MealStatusType } from "@/generated/prisma"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import kyInstance from "@/lib/ky"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { useToggleMealStatus } from "../_lib/mutations"

const toggleMealStatusSchema = z.object({
  status: z.nativeEnum(MealStatusType),
})
type ToggleMealStatusForm = z.infer<typeof toggleMealStatusSchema>

export default function MealToggleButton() {
  const id = useId()
  const { mutate: updateStatus, isPending: isMutating } = useToggleMealStatus()
  const form = useForm<ToggleMealStatusForm>({
    resolver: zodResolver(toggleMealStatusSchema),
    defaultValues: { status: "INACTIVE" },
  })
  const { register } = form
  const {
    data: result,
    isLoading: isPending,
    error,
    isError,
  } = useQuery({
    queryKey: ["meal", "status"],
    queryFn: () =>
      kyInstance
        .get("/api/user/meal/status")
        .json<{ status: MealStatusType }>(),
  })

  const handleSwitchChange = async () => {
    if (!currentStatus) return
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    updateStatus(newStatus)
  }
  const currentStatus = result?.status
  const isDisabled = isPending || isMutating || currentStatus === "SUSPENDED"
  if (isError && error) {
    toast.error(error.message)
  }
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="inline-flex items-center gap-2 [--primary:var(--color-indigo-500)] [--ring:var(--color-indigo-300)] in-[.dark]:[--primary:var(--color-indigo-500)] in-[.dark]:[--ring:var(--color-indigo-900)]">
        <Switch
          id={id}
          {...register("status")}
          checked={currentStatus === "ACTIVE"}
          onCheckedChange={handleSwitchChange}
          disabled={isDisabled}
          className="cursor-pointer"
        />
        <Label htmlFor={id} className="sr-only">
          Meal status toggle
        </Label>
      </div>

      <span
        className={cn(
          "ml-2 rounded px-2 py-1 text-sm font-medium transition-colors",
          {
            "bg-green-100 text-green-800": currentStatus === "ACTIVE",
            "bg-red-100 text-red-800": currentStatus === "INACTIVE",
            "bg-yellow-100 text-yellow-800": currentStatus === "SUSPENDED",
            "bg-gray-100 text-gray-800": isPending,
          }
        )}
      >
        {isPending
          ? "Loading..."
          : currentStatus === "SUSPENDED"
            ? "Meal status: Suspended"
            : `Meal status: ${currentStatus === "ACTIVE" ? "ON" : "OFF"}`}
      </span>
    </div>
  )
}
