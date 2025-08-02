"use client"

import { useEffect, useTransition } from "react"
import { redirect, useRouter } from "next/navigation"
import {
  DISLIKED_NON_VEG_TYPES,
  MEAL_TYPE_OPTIONS,
  NON_VEG_OPTIONS,
} from "@/constants/form.constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CheckIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

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
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "@/components/ui/tags"
import { P } from "@/components/custom/p"
import LoadingButton from "@/components/LoadingButton"

import { createUserOnboarding } from "../_lib/action"
import { useOnboardingStore } from "../_lib/store"

export default function OnboardingMealForm() {
  const router = useRouter()
  const [isPanding, startTransition] = useTransition()
  const name = useOnboardingStore((state) => state.name)
  const selfPhNo = useOnboardingStore((state) => state.selfPhNo)
  const guardianPhNo = useOnboardingStore((state) => state.guardianPhNo)
  const dob = useOnboardingStore((state) => state.dob)
  const gender = useOnboardingStore((state) => state.gender)
  const religion = useOnboardingStore((state) => state.religion)
  const address = useOnboardingStore((state) => state.address)
  const hostelId = useOnboardingStore((state) => state.hostelId)
  const education = useOnboardingStore((state) => state.education)

  type CreateMealFormValues = z.infer<typeof mealSchema>
  const form = useForm<CreateMealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      type: "VEG",
      nonVegType: "NONE",
      dislikedNonVegTypes: [],
    },
  })

  function onSubmit(values: CreateMealFormValues) {
    if (values.type === "VEG" && values.nonVegType !== "NONE") {
      toast.info("Please select none for non-veg type")
      return
    }
    startTransition(async () => {
      if (
        name &&
        gender &&
        religion &&
        dob &&
        selfPhNo &&
        address &&
        hostelId &&
        education
      ) {
        const { data: result, error } = await tryCatch(
          createUserOnboarding({
            name,
            gender,
            religion,
            dob,
            selfPhNo,
            guardianPhNo,
            address,
            hostelId,
            education,
            mealPreference: values,
          })
        )
        if (error) {
          toast.error("A Unexpected error occurred. Please try again later.")
          return
        }
        if (result.status === "success") {
          useOnboardingStore.persist.clearStorage()
          form.reset()
          toast.success(result.message)
          redirect("/dashboard")
        } else if (result.status === "error") {
          toast.error(result.message)
        }
      } else {
        toast.error("Please fill all the fields")
      }
    })
  }
  const mealType = form.watch("type")
  const isVeg = mealType === "VEG"

  useEffect(() => {
    if (!useOnboardingStore.persist.hasHydrated) return
    if (!hostelId) {
      router.push("/onboarding/identity")
    }
  }, [name, selfPhNo, dob, address, hostelId, education, router])
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-xl space-y-6"
      >
        <div className="flex flex-wrap gap-4">
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
                                    onChange(value.filter((id) => id !== type))
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

        {form.formState.errors && (
          <P className="text-center" variant="error">
            {form.formState.errors.root?.message}
          </P>
        )}

        <div className="flex w-full justify-end gap-3 p-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <LoadingButton loading={isPanding} type="submit">
            Submit
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}
