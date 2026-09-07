"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  MEAL_TIME_OPTIONS,
  MEAL_TYPE_OPTIONS,
  NON_VEG_OPTIONS,
} from "@/constants/form.constants"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Bird,
  Calendar as CalendarIcon,
  Cow,
  Egg,
  Fish,
  ForkKnife,
  Plant,
  type Icon,
} from "@phosphor-icons/react"
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns"
import { useForm } from "react-hook-form"

import type { NonVegType as NonVegTier } from "@/lib/generated/prisma"
import { guestChoiceKey, type GuestMealPricing } from "@/lib/guest-meal-rules"
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

function inr(n: number) {
  return `₹${n.toFixed(2)}`
}

const TIER_ICONS: Record<string, Icon> = {
  MUTTON: Cow,
  CHICKEN: Bird,
  FISH: Fish,
  EGG: Egg,
}

/**
 * One dropdown row: what it is, and what the mess will charge for it.
 *
 * A fragment, so the icon, label and price lay out on the flex row the select
 * item already provides - and so the same row renders inside the trigger once
 * it is picked.
 */
function ChoiceRow({
  icon: TierIcon,
  label,
  price,
  from = false,
}: {
  icon: Icon
  label: string
  price: number | null
  /** The row covers several tiers that are not all priced alike. */
  from?: boolean
}) {
  return (
    <>
      <TierIcon weight="duotone" />
      <span>{label}</span>
      {price !== null && (
        <span className="text-muted-foreground ml-auto pl-3 text-xs tabular-nums">
          {from ? `from ${inr(price)}` : inr(price)}
        </span>
      )}
    </>
  )
}

/** Lets the price sit hard right in the list; harmless in the w-fit trigger. */
const CHOICE_ITEM = "[&>span:last-child]:w-full"

function prettifyTier(tier: string) {
  return tier.charAt(0) + tier.slice(1).toLowerCase()
}

export function CreateGuestMealSheet({ ...props }: createGuestMealSheetProps) {
  const { mutate: createGuestMeal, isPending: isCreatePending } =
    useCreateGuestMeal(props.onOpenChange)
  // What the kitchen is cooking for the chosen day and slot decides which
  // non-veg options are bookable; booking above the scheduled item would make
  // the mess buy something for a single guest.
  const [allowedNonVeg, setAllowedNonVeg] = useState<NonVegTier[] | null>(null)
  const [offers, setOffers] = useState<NonVegTier[] | null>(null)
  // The dishes the prefect scheduled, by name. Whatever is on the menu shows
  // up here - nothing in this form knows any dish by name.
  const [menu, setMenu] = useState<string[]>([])
  const [dayOfWeek, setDayOfWeek] = useState<string | null>(null)
  // Price per meal for every choice in the slot. The server bills out of this
  // same map, so the figure below is the figure charged - the form used to
  // quote the menu price while the rate table did the billing.
  const [pricing, setPricing] = useState<GuestMealPricing | null>(null)
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

  useEffect(() => {
    if (!watchedDate) return
    let cancelled = false

    getAllowedGuestMealOptions(watchedDate, watchedMealTime)
      .then((slot) => {
        if (cancelled) return
        const { offers: scheduled, allowed, pricing: slotPricing } = slot
        setOffers(scheduled)
        setPricing(slotPricing)
        setMenu(slot.menu)
        setDayOfWeek(slot.dayOfWeek)

        const tiers = allowed.filter((type) => type !== "NONE")
        setAllowedNonVeg(tiers)

        // Nothing non-veg is cooked for this slot, so a non-veg booking is a
        // dead end: an empty tier list, no price, and a submit that fails
        // validation. Put the guest back on veg instead of letting them find
        // that out at the end.
        if (tiers.length === 0) {
          if (form.getValues("type") === "NON_VEG") {
            form.setValue("type", "VEG", { shouldValidate: false })
          }
          form.setValue("nonVegType", "NONE", { shouldValidate: false })
          return
        }

        // Leaving a now-invalid choice selected would only fail on submit.
        const current = form.getValues("nonVegType")
        if (current && current !== "NONE" && !allowed.includes(current)) {
          form.setValue("nonVegType", "NONE", { shouldValidate: false })
        }
      })
      .catch(() => {
        if (cancelled) return
        setAllowedNonVeg(null)
        // Better nothing than a stale menu or figure from the previous slot.
        setPricing(null)
        setMenu([])
        setDayOfWeek(null)
      })

    return () => {
      cancelled = true
    }
  }, [watchedDate, watchedMealTime, form])

  const nonVegChoices = (
    allowedNonVeg ?? NON_VEG_OPTIONS.filter((type) => type !== "NONE")
  ).filter((type) => type !== "NONE")

  // Lunch and dinner, and veg and each tier, can each carry their own rate,
  // so every dropdown row is priced from the same map the server bills from.
  const watchedType = form.watch("type")
  const watchedNonVegType = form.watch("nonVegType")
  const watchedMeals = Number(form.watch("numberOfMeals") || 0)

  const priceFor = (type: "VEG" | "NON_VEG", nonVegType: NonVegTier) =>
    pricing?.prices[guestChoiceKey({ type, nonVegType })] ?? null

  const vegPrice = priceFor("VEG", "NONE")

  // Non-veg spans several tiers, so its row quotes the cheapest and says so
  // rather than pretending one figure covers the lot.
  const nonVegPrices = nonVegChoices
    .map((tier) => priceFor("NON_VEG", tier))
    .filter((price): price is number => price !== null)
  const cheapestNonVeg =
    nonVegPrices.length > 0 ? Math.min(...nonVegPrices) : null
  const nonVegVaries =
    cheapestNonVeg !== null && Math.max(...nonVegPrices) !== cheapestNonVeg

  // "Non-veg with no tier picked" is a real state - it is what the form opens
  // into the moment you switch to Non-Veg - and it has no price of its own,
  // so quote the cheapest on offer instead of dropping the line entirely.
  const pickedPrice =
    watchedType === "VEG"
      ? vegPrice
      : priceFor("NON_VEG", watchedNonVegType ?? "NONE")
  const unitPrice = pickedPrice ?? cheapestNonVeg ?? vegPrice
  const quoteIsFrom = pickedPrice === null && nonVegVaries

  // Only an actual empty tier list means veg only; null means the quote is in
  // flight or failed, and guessing then would disable a valid choice.
  const vegOnly = allowedNonVeg !== null && allowedNonVeg.length === 0

  // What the kitchen is cooking, named. Falls back to the generic slot label
  // only when the prefect has scheduled nothing for it.
  const menuLabel = menu.length > 0 ? menu.join(", ") : null
  const slotLabel = [dayOfWeek?.toLowerCase(), watchedMealTime.toLowerCase()]
    .filter(Boolean)
    .join(" ")

  const choiceLabel =
    watchedType === "VEG"
      ? "veg"
      : watchedNonVegType && watchedNonVegType !== "NONE"
        ? watchedNonVegType.toLowerCase()
        : "non-veg"

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
              </div>

              {/* What the kitchen is actually cooking, read straight off the
                  schedule - a dish added later needs no change here. */}
              {menuLabel && (
                <div className="bg-muted/40 rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ForkKnife weight="duotone" className="size-4 shrink-0" />
                    <span className="capitalize">{slotLabel}</span>
                  </div>
                  <p className="mt-1 text-sm">{menuLabel}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {offers && offers.length > 0
                      ? `Served with ${offers.map(prettifyTier).join(", ")} or veg.`
                      : "Vegetarian only."}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
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
                        // Controlled: the effect above snaps this back to veg
                        // on a veg-only slot, which an uncontrolled select
                        // would keep showing as Non-Veg.
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEAL_TYPE_OPTIONS.map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              className={CHOICE_ITEM}
                              disabled={type === "NON_VEG" && vegOnly}
                            >
                              <ChoiceRow
                                icon={type === "NON_VEG" ? ForkKnife : Plant}
                                label={type === "NON_VEG" ? "Non-Veg" : "Veg"}
                                price={
                                  type === "NON_VEG" ? cheapestNonVeg : vegPrice
                                }
                                from={type === "NON_VEG" && nonVegVaries}
                              />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {vegOnly && (
                        <FormDescription>
                          {menuLabel ?? `This ${watchedMealTime.toLowerCase()}`}{" "}
                          is vegetarian only.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchedType === "NON_VEG" && (
                  <FormField
                    control={form.control}
                    name="nonVegType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Non-Veg Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          // "" shows the placeholder like undefined does, but
                          // keeps the select controlled for its whole life.
                          value={field.value === "NONE" ? "" : field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pick a non-veg type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nonVegChoices.map((tier) => (
                              <SelectItem
                                key={tier}
                                value={tier}
                                className={CHOICE_ITEM}
                              >
                                <ChoiceRow
                                  icon={TIER_ICONS[tier] ?? ForkKnife}
                                  label={prettifyTier(tier)}
                                  price={priceFor("NON_VEG", tier)}
                                />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {offers && offers.length > 0 && (
                          <FormDescription>
                            {menuLabel ?? "This meal"} is served with{" "}
                            {offers.map(prettifyTier).join(", ")}. Anything else
                            is not being cooked.
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
                    {unitPrice !== null && (
                      <FormDescription>
                        {quoteIsFrom ? "From " : ""}
                        {inr(unitPrice)} per meal for{" "}
                        {menuLabel ?? watchedMealTime.toLowerCase()}
                        {pricing?.flat
                          ? " — the same whatever your guest picks"
                          : ` with ${choiceLabel}`}
                        {watchedMeals > 1 &&
                          `, so ${inr(unitPrice * watchedMeals)} in total`}
                        .
                      </FormDescription>
                    )}
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
