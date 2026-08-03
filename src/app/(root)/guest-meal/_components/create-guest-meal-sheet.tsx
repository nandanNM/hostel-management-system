"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  MEAL_TIME_OPTIONS,
  MEAL_TYPE_OPTIONS,
  NON_VEG_OPTIONS,
} from "@/constants/form.constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar as CalendarIcon } from "@phosphor-icons/react"
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns"
import { useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import { guestMealSchema, type GuestMeal } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import LoadingButton from "@/components/LoadingButton"

import {
  getAllowedGuestMealOptions,
  getGuestBookingWindow,
} from "../_lib/action"
import { useCreateGuestMeal } from "../_lib/mutations"

type createGuestMealSheetProps = React.ComponentPropsWithRef<typeof Sheet>

export function CreateGuestMealSheet({ ...props }: createGuestMealSheetProps) {
  const { mutate: createGuestMeal, isPending: isCreatePending } =
    useCreateGuestMeal(props.onOpenChange)
  // What the kitchen is cooking for the chosen day and slot decides which
  // non-veg options are bookable; booking above the scheduled item would make
  // the mess buy something for a single guest.
  const [allowedNonVeg, setAllowedNonVeg] = useState<string[] | null>(null)
  const [offering, setOffering] = useState<string | null>(null)
  // The prefect sets the horizon; 3 days was hardcoded here before.
  const [maxDaysAhead, setMaxDaysAhead] = useState(3)

  const form = useForm<GuestMeal>({
    resolver: zodResolver(guestMealSchema),
    defaultValues: {
      name: "",
      type: "VEG",
      nonVegType: "NONE",
      mobileNumber: "",
      mealTime: "LUNCH",
      numberOfMeals: 1,
      date: new Date(),
    },
  })

  useEffect(() => {
    let cancelled = false
    getGuestBookingWindow()
      .then(({ maxDaysAhead: horizon }) => {
        if (!cancelled) setMaxDaysAhead(horizon)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const watchedDate = form.watch("date")
  const watchedMealTime = form.watch("mealTime")
  const watchedType = form.watch("type")

  useEffect(() => {
    if (watchedType !== "NON_VEG" || !watchedDate) return
    let cancelled = false

    getAllowedGuestMealOptions(watchedDate, watchedMealTime)
      .then(({ offering: scheduled, allowed }) => {
        if (cancelled) return
        setOffering(scheduled)
        setAllowedNonVeg(allowed.filter((type) => type !== "NONE"))

        // Leaving a now-invalid choice selected would only fail on submit.
        const current = form.getValues("nonVegType")
        if (current && current !== "NONE" && !allowed.includes(current)) {
          form.setValue("nonVegType", "NONE", { shouldValidate: false })
        }
      })
      .catch(() => {
        if (!cancelled) setAllowedNonVeg(null)
      })

    return () => {
      cancelled = true
    }
  }, [watchedDate, watchedMealTime, watchedType, form])

  const nonVegChoices = (
    allowedNonVeg ?? NON_VEG_OPTIONS.filter((type) => type !== "NONE")
  ).filter((type) => type !== "NONE")

  function onSubmit(values: GuestMeal) {
    createGuestMeal(values)
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex h-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle>Create Guest Meal Request</SheetTitle>
          <SheetDescription>
            Fill out the form to create a new guest meal request
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* min-h-0 is what lets this shrink inside the flex column - without
                it the fields push the footer past the bottom of the screen. */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel> Guest Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter guest name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Meal Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date: Date) => {
                              const today = startOfDay(new Date())
                              const maxDate = startOfDay(
                                addDays(today, maxDaysAhead)
                              )
                              const targetDate = startOfDay(date)
                              return (
                                isBefore(targetDate, today) ||
                                isAfter(targetDate, maxDate)
                              )
                            }}
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mealTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEAL_TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time.charAt(0) + time.slice(1).toLowerCase()}
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type</FormLabel>
                      <Select
                        onValueChange={(val: "VEG" | "NON_VEG") => {
                          field.onChange(val)
                          if (val === "VEG") {
                            form.setValue("nonVegType", "NONE")
                          }
                        }}
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
                              {type === "NON_VEG" ? "Non-Veg" : "Veg"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("type") === "NON_VEG" && (
                  <FormField
                    control={form.control}
                    name="nonVegType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Non-Veg Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select non-veg type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nonVegChoices.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {offering && (
                          <FormDescription>
                            {offering.charAt(0) +
                              offering.slice(1).toLowerCase()}{" "}
                            is scheduled for this meal, so richer options are
                            not available.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter guest phone number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfMeals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Meals</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number of meals required by guest"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="mealCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel> Meal Charge</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>
            <SheetFooter className="bg-background gap-2 border-t p-4 sm:space-x-0">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <LoadingButton loading={isCreatePending} type="submit">
                Submit
              </LoadingButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
