"use client"

import type React from "react"
import {
  MEAL_TIME_OPTIONS,
  MEAL_TYPE_OPTIONS,
  NON_VEG_OPTIONS,
} from "@/constants/form.constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import { guestMealSchema, type GuestMeal } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
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

import { useCreateGuestMeal } from "../_lib/mutations"

interface createGuestMealSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {}

export function CreateGuestMealSheet({ ...props }: createGuestMealSheetProps) {
  const { mutate: createGuestMeal, isPending: isCreatePending } =
    useCreateGuestMeal(props.onOpenChange)
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

  function onSubmit(values: GuestMeal) {
    createGuestMeal(values)
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Create Guest Meal Request</SheetTitle>
          <SheetDescription>
            Fill out the form to create a new guest meal request
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <ScrollArea className="flex-grow">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mx-auto max-w-xl space-y-4 p-4"
            >
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
                        defaultValue={field.value}
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
                              const maxDate = startOfDay(addDays(today, 3))
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
                              {time}
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
              <SheetFooter className="gap-2 p-0 sm:space-x-0">
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
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
