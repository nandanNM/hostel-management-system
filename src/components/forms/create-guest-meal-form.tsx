"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestMealSchema, GuestMeal } from "@/lib/validations";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  MEAL_TIME_OPTIONS,
  MEAL_TYPE_OPTIONS,
  NON_VEG_OPTIONS,
} from "@/constants/form.constants";
import { Input } from "@/components/ui/input";
import LoadingButton from "@/components/LoadingButton";
import { tryCatch } from "@/hooks/try-catch";
import { createGuestMeal } from "./action";
import { toast } from "sonner";
import { useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
export default function CreateGuestMealForm() {
  const [isPanding, startTransition] = useTransition();
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
      mealCharge: 0,
      message: "",
    },
  });
  function onSubmit(values: GuestMeal) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createGuestMeal(values));
      if (error) {
        toast.error("A Unexpected error occurred. Please try again later.");
        return;
      }
      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-xl space-y-6"
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
                <FormLabel>Date of birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
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
                        const today = startOfDay(new Date());
                        const maxDate = startOfDay(addDays(today, 3));
                        const targetDate = startOfDay(date);

                        return (
                          isBefore(targetDate, today) ||
                          isAfter(targetDate, maxDate)
                        );
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
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meal Message</FormLabel>
              <FormControl>
                <Input placeholder="Optional message..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
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
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex w-full justify-end gap-3 p-4">
          <LoadingButton loading={isPanding} type="submit">
            Submit
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
