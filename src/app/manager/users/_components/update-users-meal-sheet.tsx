"use client"

import React from "react"
import {
  DISLIKED_NON_VEG_TYPES,
  MEAL_TYPE_OPTIONS,
  NON_VEG_OPTIONS,
} from "@/constants/form.constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { ReloadIcon } from "@radix-ui/react-icons"
import { CheckIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import { GetMealWithUser } from "@/types/prisma.type"
import { cn } from "@/lib/utils"
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
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "@/components/ui/tags"

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
      dislikedNonVegTypes: meal.dislikedNonVegTypes || [],
    },
  })

  const mealType = form.watch("type")
  const isVeg = mealType === "VEG"
  React.useEffect(() => {
    form.reset({
      type: meal.type ?? "VEG",
      nonVegType: meal.nonVegType ?? "NONE",
      dislikedNonVegTypes: meal.dislikedNonVegTypes ?? [],
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
          <SheetTitle>Update Meal</SheetTitle>
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
                      disabled={isVeg}
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
            <FormField
              control={form.control}
              name="dislikedNonVegTypes"
              render={() => (
                <FormItem>
                  <FormLabel>Disliked Non-Veg Types</FormLabel>
                  <FormControl>
                    <Controller
                      name="dislikedNonVegTypes"
                      control={form.control}
                      render={({ field: { onChange, value = [] } }) => (
                        <Tags
                          value={value}
                          setValue={(newTags) => onChange(newTags || [])}
                        >
                          <TagsTrigger disabled={isVeg}>
                            {value.map((tagId) => {
                              const tagLabel = DISLIKED_NON_VEG_TYPES.find(
                                (type) => type === tagId
                              )
                              return tagLabel ? (
                                <TagsValue
                                  key={tagId}
                                  onRemove={() => {
                                    onChange(value.filter((id) => id !== tagId))
                                  }}
                                >
                                  {tagLabel}
                                </TagsValue>
                              ) : null
                            })}
                          </TagsTrigger>
                          <TagsContent>
                            <TagsList>
                              <TagsEmpty />
                              <TagsGroup>
                                {DISLIKED_NON_VEG_TYPES.map((type) => (
                                  <TagsItem
                                    key={type}
                                    value={type}
                                    onSelect={() => {
                                      if (value.includes(type)) {
                                        onChange(
                                          value.filter((id) => id !== type)
                                        )
                                      } else {
                                        onChange([...value, type])
                                      }
                                    }}
                                  >
                                    {type}
                                    <CheckIcon
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        value.includes(type)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </TagsItem>
                                ))}
                              </TagsGroup>
                            </TagsList>
                          </TagsContent>
                        </Tags>
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
