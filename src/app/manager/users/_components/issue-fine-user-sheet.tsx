"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, ReloadIcon } from "@radix-ui/react-icons"
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { tryCatch } from "@/hooks/try-catch"
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

import { issueFineToUser } from "../_lib/actions"
import { createUserFineSchema, CreateUserFineSchema } from "../_lib/validations"

interface CreateFineSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  targetUserId: string
}

export function CreateFineSheet({
  targetUserId,
  ...props
}: CreateFineSheetProps) {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<CreateUserFineSchema>({
    resolver: zodResolver(createUserFineSchema),
    defaultValues: {
      targetUserId,
      fineAmount: "",
      fineReason: "",
      fineDueDate: new Date(),
    },
  })

  function onSubmit(input: CreateUserFineSchema) {
    startTransition(async () => {
      const { data, error } = await tryCatch(issueFineToUser(input))

      if (error) {
        toast.error("Failed to issue fine.")
        return
      }

      if (data?.status === "success") {
        toast.success("Fine issued successfully.")
        form.reset()
        props.onOpenChange?.(false)
      } else {
        toast.error(data?.message || "Something went wrong.")
      }
    })
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-3 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Issue Fine</SheetTitle>
          <SheetDescription>
            Fill out fine details for the student
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 p-4"
          >
            <FormField
              control={form.control}
              name="fineAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter fine amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fineReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for the fine"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fineDueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
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
                            <span>Pick a due date</span>
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
                          const maxDate = startOfDay(addDays(today, 15))
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

            <SheetFooter className="gap-2 p-0 pt-2">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button disabled={isPending}>
                {isPending && (
                  <ReloadIcon className="mr-2 size-4 animate-spin" />
                )}
                Issue Fine
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
