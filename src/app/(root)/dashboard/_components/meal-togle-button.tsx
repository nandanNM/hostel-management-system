"use client"

import { useId } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import { MealStatusType } from "@/lib/generated/prisma"
import kyInstance from "@/lib/ky"
import { Badge } from "@/components/ui/crazxy-ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { useToggleMealStatus } from "../_lib/mutations"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
    refetchOnWindowFocus: false,
  })

  const currentStatus = result?.status
  const isDisabled = isPending || isMutating || currentStatus === "SUSPENDED"
  
  if (isError && error) {
    toast.error(error.message)
  }

  const handleConfirm = () => {
    if (!currentStatus) return
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    updateStatus(newStatus)
  }

  return (
    <div className="flex items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <div className="inline-flex items-center gap-2 [--primary:var(--color-indigo-500)] [--ring:var(--color-indigo-300)] in-[.dark]:[--primary:var(--color-indigo-500)] in-[.dark]:[--ring:var(--color-indigo-900)]">
            <Switch
              id={id}
              {...register("status")}
              checked={currentStatus === "ACTIVE"}
              onCheckedChange={() => {}} // Controlled by AlertDialog trigger
              disabled={isDisabled}
              className="cursor-pointer"
            />
            <Label htmlFor={id} className="sr-only">
              Meal status toggle
            </Label>
          </div>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Meal Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to turn your meal status{" "}
              <span className="font-semibold text-foreground">
                {currentStatus === "ACTIVE" ? "OFF" : "ON"}
              </span>
              ? This will update your mess requirements for the next meal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Badge
        variant={
          isPending
            ? "outline"
            : currentStatus === "ACTIVE"
              ? "default"
              : currentStatus === "INACTIVE"
                ? "destructive"
                : "secondary"
        }
        size="sm"
        className="ml-2"
      >
        {isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : currentStatus === "SUSPENDED" ? (
          "Meal status: Suspended"
        ) : (
          `Meal status: ${currentStatus === "ACTIVE" ? "ON" : "OFF"}`
        )}
      </Badge>
    </div>
  )
}
