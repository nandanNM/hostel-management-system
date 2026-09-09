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
  GraduationCap,
  Plant,
  type Icon,
} from "@phosphor-icons/react"
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns"
import { useForm } from "react-hook-form"

import type { NonVegType as NonVegTier } from "@/lib/generated/prisma"
import {
  applyAlumniDiscount,
  guestChoiceKey,
  type GuestMealPricing,
} from "@/lib/guest-meal-rules"
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
import { Checkbox } from "@/components/motion/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  type ComboboxFilter,
} from "@/components/motion/combobox"
import UserAvatar from "@/components/UserAvatar"

import {
  getAllowedGuestMealOptions,
  getAlumniOptions,
  getGuestBookingSettings,
  type AlumniOption,
} from "../_lib/action"
import { useCreateGuestMeal } from "../_lib/mutations"

type createGuestMealSheetProps = React.ComponentPropsWithRef<typeof Sheet>

function inr(n: number) {
  return `₹${n.toFixed(2)}`
}

/** Ties the checkbox to the label the graduation cap sits in. */
const ALUMNI_TOGGLE_ID = "alumni-booking"

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

/**
 * Matches typed text against the alumnus's name, department and year.
 *
 * The default filter also searches the item's `value`, which here is a cuid,
 * so a stray letter could match an id nobody typed. Substring rather than the
 * default subsequence match, too: on a list of names, "ana" should not pull up
 * "Nandan".
 */
const filterAlumni: ComboboxFilter = (_value, query, keywords) => {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return true
  return keywords.join(" ").toLocaleLowerCase().includes(needle)
}

/**
 * The alumnus's number in the form's own 10-digit shape, or null when the
 * directory holds something else - a landline, a +91 prefix, a blank. Better
 * to leave the field empty than to prefill something that fails validation.
 */
function tenDigitMobile(stored: string): string | null {
  const digits = stored.replace(/\D/g, "")
  return digits.length === 10 ? digits : null
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
  // The slots the kitchen already has a count for, straight from
  // daily_meal_activities. Empty until the first fetch answers, so nothing is
  // closed on a guess.
  const [generatedSlots, setGeneratedSlots] = useState<string[]>([])
  // Price per meal for every choice in the slot. The server bills out of this
  // same map, so the figure below is the figure charged - the form used to
  // quote the menu price while the rate table did the billing.
  const [pricing, setPricing] = useState<GuestMealPricing | null>(null)
  // The prefect sets the horizon; 3 days was hardcoded here before.
  const [maxDaysAhead, setMaxDaysAhead] = useState(3)
  // What an alumni booking takes off each meal. Read from the same config the
  // server bills from, so the quote below is the charge.
  const [alumniDiscount, setAlumniDiscount] = useState(0)
  // Booking for an alumnus: the guest's name then comes off the directory
  // rather than being typed, which is what lets every log mark it as one.
  const [isAlumniBooking, setIsAlumniBooking] = useState(false)
  // null until the directory has been read - an empty directory is a real
  // answer ("no alumni yet") and must not read as still loading.
  const [alumni, setAlumni] = useState<AlumniOption[] | null>(null)
  const [alumniError, setAlumniError] = useState(false)

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
      alumniId: null,
    },
  })

  useEffect(() => {
    let cancelled = false
    getGuestBookingSettings()
      .then(({ maxDaysAhead: horizon, alumniDiscount: discount }) => {
        if (cancelled) return
        setMaxDaysAhead(horizon)
        setAlumniDiscount(discount)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const watchedDate = form.watch("date")
  const watchedMealTime = form.watch("mealTime")

  // A slot closes when its count has gone to the kitchen - not because of the
  // clock, and never for a count nobody generated. The server rejects a closed
  // slot either way; this saves the guest filling the form out first.
  const isSlotClosed = (slot: string) => generatedSlots.includes(slot)

  // Leaving a closed slot selected would only fail on submit, so move to the
  // other one when it is still open.
  useEffect(() => {
    const selected = form.getValues("mealTime")
    if (!generatedSlots.includes(selected)) return

    const open = MEAL_TIME_OPTIONS.find(
      (slot) => !generatedSlots.includes(slot)
    )
    if (open) form.setValue("mealTime", open, { shouldValidate: false })
  }, [generatedSlots, watchedMealTime, form])

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
        setGeneratedSlots(slot.generatedSlots)

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
        // Better to let the server refuse a closed slot than to close one on
        // the strength of an answer that never arrived.
        setGeneratedSlots([])
      })

    return () => {
      cancelled = true
    }
  }, [watchedDate, watchedMealTime, form])

  const nonVegChoices = (
    allowedNonVeg ?? NON_VEG_OPTIONS.filter((type) => type !== "NONE")
  ).filter((type) => type !== "NONE")

  const watchedAlumniId = form.watch("alumniId")

  // Fetched only once the box is ticked - most bookings are for an ordinary
  // guest and never need the directory at all.
  useEffect(() => {
    if (!isAlumniBooking || alumni !== null) return
    let cancelled = false

    getAlumniOptions()
      .then((rows) => {
        if (!cancelled) setAlumni(rows)
      })
      .catch(() => {
        if (!cancelled) setAlumniError(true)
      })

    return () => {
      cancelled = true
    }
  }, [isAlumniBooking, alumni])

  const selectedAlumni =
    alumni?.find((person) => person.id === watchedAlumniId) ?? null

  /** Picking an alumnus fills the booking in as that person. */
  function pickAlumni(id: string) {
    const person = alumni?.find((row) => row.id === id)
    if (!person) return

    form.setValue("alumniId", person.id, { shouldValidate: false })
    form.setValue("name", person.name, { shouldValidate: true })

    const mobile = tenDigitMobile(person.mobileNumber)
    if (mobile) form.setValue("mobileNumber", mobile, { shouldValidate: true })
  }

  /**
   * Unticking undoes what the picker filled in: those fields held the
   * alumnus's details, not this guest's, and the name field is about to come
   * back on screen for a name to be typed into.
   */
  function toggleAlumniBooking(checked: boolean) {
    setIsAlumniBooking(checked)
    if (checked) return

    if (selectedAlumni) {
      form.setValue("name", "", { shouldValidate: false })
      // Only the number the picker wrote - a hand-typed one stays.
      if (
        form.getValues("mobileNumber") ===
        tenDigitMobile(selectedAlumni.mobileNumber)
      ) {
        form.setValue("mobileNumber", "", { shouldValidate: false })
      }
    }

    form.setValue("alumniId", null, { shouldValidate: false })
  }

  // Lunch and dinner, and veg and each tier, can each carry their own rate,
  // so every dropdown row is priced from the same map the server bills from.
  const watchedType = form.watch("type")
  const watchedNonVegType = form.watch("nonVegType")
  const watchedMeals = Number(form.watch("numberOfMeals") || 0)

  // An alumni booking is discounted per meal, and the server discounts the
  // same figure with the same function - so every price on screen, dropdown
  // rows included, is already net. Quoting gross here and billing net would
  // put the form back to disagreeing with the bill.
  const discountApplies = selectedAlumni !== null && alumniDiscount > 0

  const priceFor = (type: "VEG" | "NON_VEG", nonVegType: NonVegTier) => {
    const listed = pricing?.prices[guestChoiceKey({ type, nonVegType })] ?? null
    if (listed === null) return null
    return discountApplies
      ? applyAlumniDiscount(listed, alumniDiscount)
      : listed
  }

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
              {/* First thing on the form: who the guest is decides both the
                  name field below and what the meal costs. Plain, like every
                  other field here - the panel further down is the menu's, and
                  a second boxed block would read as another notice. */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={ALUMNI_TOGGLE_ID}
                    checked={isAlumniBooking}
                    onCheckedChange={toggleAlumniBooking}
                    aria-label="Booking for an alumnus"
                  />
                  {/* Its own label rather than the checkbox's, so the cap sits
                      between the box and the words and stays clickable. */}
                  <label
                    htmlFor={ALUMNI_TOGGLE_ID}
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium select-none"
                  >
                    <GraduationCap
                      weight="duotone"
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden
                    />
                    Booking for an alumnus
                  </label>
                </div>

                {isAlumniBooking && (
                  <div className="space-y-1.5">
                    <Combobox
                      value={watchedAlumniId ?? undefined}
                      onValueChange={pickAlumni}
                      filter={filterAlumni}
                      disabled={alumniError || alumni?.length === 0}
                    >
                      {/* Matched to this form's Input: same height, radius,
                          border and shadow, and free to shrink on a phone. */}
                      <ComboboxTrigger className="border-input h-9 min-w-0 rounded-md shadow-xs">
                        <ComboboxInput
                          className="h-9"
                          aria-label="Search alumni"
                          placeholder={
                            alumniError
                              ? "Could not load the directory"
                              : alumni?.length === 0
                                ? "No alumni in the directory yet"
                                : "Search alumni by name…"
                          }
                        />
                      </ComboboxTrigger>
                      <ComboboxContent className="rounded-md">
                        <ComboboxList ariaLabel="Alumni">
                          <ComboboxEmpty>
                            {alumni === null
                              ? "Loading the directory…"
                              : "No alumnus by that name."}
                          </ComboboxEmpty>
                          {(alumni ?? []).map((person) => (
                            <ComboboxItem
                              key={person.id}
                              value={person.id}
                              textValue={person.name}
                              keywords={[person.department, person.year]}
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                {/* Their photo when the directory has one.
                                    UserAvatar falls back to a generic
                                    silhouette rather than failing, so the cap
                                    - which at least says "alumnus" - takes
                                    the no-photo case instead. */}
                                {person.image ? (
                                  <UserAvatar
                                    size={28}
                                    avatarUrl={person.image}
                                    className="size-7"
                                  />
                                ) : (
                                  <span className="grid size-7 shrink-0 place-items-center">
                                    <GraduationCap
                                      weight="duotone"
                                      className="text-muted-foreground size-4"
                                      aria-hidden
                                    />
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <span className="text-foreground block truncate font-medium">
                                    {person.name}
                                  </span>
                                  <span className="text-muted-foreground block truncate text-xs">
                                    {person.department} · {person.year}
                                  </span>
                                </span>
                              </span>
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {/* The Guest Name field is hidden while this is on, so
                        its "name required" has to surface here instead. */}
                    <p
                      className={cn(
                        "text-xs",
                        !selectedAlumni && form.formState.errors.name
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {selectedAlumni
                        ? alumniDiscount > 0
                          ? `${selectedAlumni.name} gets ${inr(alumniDiscount)} off every meal.`
                          : `Booking for ${selectedAlumni.name}. No alumni discount is set.`
                        : form.formState.errors.name
                          ? "Pick the alumnus this meal is for."
                          : "Pick the alumnus - their name becomes the guest name."}
                    </p>
                  </div>
                )}
              </div>

              {/* Nothing to ask for on an alumni booking: the guest *is* the
                  alumnus, so the picker above has already named them. One
                  less field to scroll past and nothing to type. */}
              {!isAlumniBooking && (
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
              )}
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
                        // Controlled: the effect above snaps this to dinner on
                        // today, which an uncontrolled select would keep
                        // showing as Lunch.
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEAL_TIME_OPTIONS.map((time) => (
                            <SelectItem
                              key={time}
                              value={time}
                              disabled={isSlotClosed(time)}
                            >
                              {time.charAt(0) + time.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {generatedSlots.length > 0 && (
                        <FormDescription>
                          {generatedSlots
                            .map((slot) => slot.toLowerCase())
                            .join(" and ")}{" "}
                          {generatedSlots.length > 1
                            ? "counts are"
                            : "count is"}{" "}
                          already with the kitchen for this date, so nothing
                          more can be added.
                        </FormDescription>
                      )}
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
                        {discountApplies &&
                          ` The ${inr(alumniDiscount)} alumni discount is already off.`}
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
