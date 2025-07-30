"use client"

import React from "react"
import { MEAL_TYPE_OPTIONS, NON_VEG_OPTIONS } from "@/constants/form.constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { ReloadIcon } from "@radix-ui/react-icons"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import { GetMealWithUser } from "@/types/prisma.type"
import { mealSchema } from "@/lib/validations"
import { tryCatch } from "@/hooks/try-catch"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { updateMeal } from "../_lib/actions"

interface UpdateMealSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  meal: GetMealWithUser
}
type UpdateMealSchema = z.infer<typeof mealSchema>
export function UpdateMealSheet({ meal, ...props }: UpdateMealSheetProps) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition()

  const form = useForm<UpdateMealSchema>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      type: meal.type || "VEG",
      nonVegType: meal.nonVegType || "NONE",
    },
  })

  React.useEffect(() => {
    form.reset({
      type: meal.type ?? "VEG",
      nonVegType: meal.nonVegType ?? "NONE",
    })
  }, [meal, form])

  function onSubmit(input: UpdateMealSchema) {
    startUpdateTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateMeal({
          id: meal.id,
          ...input,
        })
      )
      if (error) {
        toast.error("Failed to update meal status.")
        return
      }
      if (result.status === "success") {
        form.reset()
        props.onOpenChange?.(false)
        toast.success("Meal updated successfully.")
      } else if (result.status === "error") {
        toast.error(result.message)
      }
    })
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Update task</SheetTitle>
          <SheetDescription>
            Update the task details and save the changes
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 p-4"
          >
            <div className="flex gap-4 md:gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEAL_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nonVegType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Non-Veg Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select non-veg type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NON_VEG_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="gap-2 pt-2 sm:space-x-0">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button disabled={isUpdatePending}>
                {isUpdatePending && (
                  <ReloadIcon
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Save
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
