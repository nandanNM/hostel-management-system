"use client"

import type React from "react"
import { useState } from "react"
import {
  MEAL_EVENT_TYPE_OPTIONS,
  MEAL_TIME_OPTIONS,
} from "@/constants/form.constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns"
import { CalendarIcon, SendIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { cn, getCurrentMealSlot } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { Textarea } from "@/components/ui/textarea"
import LoadingButton from "@/components/LoadingButton"

import { sendMealMessage } from "../_lib/action"
import { MealMessage, mealMessageSchema } from "../_lib/validation"

export function MealMessageDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const mutation = useMutation({
    mutationFn: sendMealMessage,
    onSuccess: () => {
      toast.success("Your meal message has been sent.")
      setIsOpen(false)
      form.reset()
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`)
    },
  })
  const form = useForm<MealMessage>({
    resolver: zodResolver(mealMessageSchema),
    defaultValues: {
      mealTime: getCurrentMealSlot(),
      date: new Date(),
      type: "REQUEST",
      message: "",
    },
  })
  const onSubmit = (data: MealMessage) => {
    mutation.mutate({
      ...data,
    })
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <SendIcon className="mr-2 h-4 w-4" /> Send Meal Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Meal Message</DialogTitle>
          <DialogDescription>
            Share details about your meal. Click send when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            {/* Date */}
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
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = startOfDay(new Date())
                          const max = startOfDay(addDays(today, 2))
                          const selected = startOfDay(date)
                          return (
                            isBefore(selected, today) || isAfter(selected, max)
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

            {/* Meal Time */}
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
                      {MEAL_TIME_OPTIONS.map((mealTime) => (
                        <SelectItem key={mealTime} value={mealTime}>
                          {mealTime}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEAL_EVENT_TYPE_OPTIONS.map((type) => (
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

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What did you eat? How did you feel?"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Send Message
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
