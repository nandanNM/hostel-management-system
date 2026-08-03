"use client"

import { useState, useTransition } from "react"
import { ArrowDown, ArrowUp } from "@phosphor-icons/react"

import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import LoadingButton from "@/components/LoadingButton"

import {
  resetMessConfig,
  updateMessConfig,
  upsertGuestMealRate,
  type GuestMealRateRow,
  type MessConfigInput,
} from "../_lib/actions"

type MessConfigFormProps = {
  config: MessConfigInput
  rates: GuestMealRateRow[]
}

const NUMBER_FIELDS: {
  key: Exclude<keyof MessConfigInput, "nonVegPriority">
  label: string
  hint: string
  suffix?: string
}[] = [
  {
    key: "guestBookingMaxDaysAhead",
    label: "Booking horizon",
    hint: "How many days ahead a guest meal can be booked. 0 means today only.",
    suffix: "days",
  },
  {
    key: "guestBookingCutoffMinutes",
    label: "Booking cutoff",
    hint: "Same-day bookings close this many minutes before the slot starts.",
    suffix: "minutes",
  },
  {
    key: "lunchStartMinute",
    label: "Lunch starts",
    hint: "Minutes after midnight IST. 750 is 12:30 PM.",
  },
  {
    key: "dinnerStartMinute",
    label: "Dinner starts",
    hint: "Minutes after midnight IST. 1230 is 8:30 PM.",
  },
  {
    key: "maxGuestsPerBooking",
    label: "Guests per booking",
    hint: "Largest number of guest meals in one request. 0 removes the cap.",
    suffix: "meals",
  },
  {
    key: "maxGuestMealsPerUserPerMonth",
    label: "Monthly quota per boarder",
    hint: "Total guest meals one boarder can book in a month. 0 removes the cap.",
    suffix: "meals",
  },
  {
    key: "mealPreferenceLockMinutes",
    label: "Preference lock",
    hint: "How long meal preferences stay locked after a count is generated.",
    suffix: "minutes",
  },
  {
    key: "guestMealFallbackCharge",
    label: "Fallback charge",
    hint: "Used when no rate and no menu item cost is configured.",
    suffix: "₹",
  },
]

function minuteLabel(minute: number) {
  const h24 = Math.floor(minute / 60) % 24
  const mm = String(minute % 60).padStart(2, "0")
  const suffix = h24 < 12 ? "AM" : "PM"
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${mm} ${suffix}`
}

function prettify(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

export function MessConfigForm({ config, rates }: MessConfigFormProps) {
  const [values, setValues] = useState<MessConfigInput>(config)
  const [rateRows, setRateRows] = useState(rates)
  const [isSaving, startSaving] = useTransition()
  const [isResetting, startResetting] = useTransition()

  const movePriority = (index: number, direction: -1 | 1) => {
    const target = index + direction
    const next = [...values.nonVegPriority]
    if (target < 0 || target >= next.length) return
    const [moved] = next.splice(index, 1)
    if (!moved) return
    next.splice(target, 0, moved)
    setValues({ ...values, nonVegPriority: next })
  }

  const setNumber = (key: keyof MessConfigInput, raw: string) => {
    const parsed = Number(raw)
    setValues({
      ...values,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    })
  }

  const save = () =>
    startSaving(async () => {
      const result = await updateMessConfig(values)
      if (result.status === "success") toast.success(result.message)
      else toast.error(result.message)
    })

  const reset = () =>
    startResetting(async () => {
      const result = await resetMessConfig()
      if (result.status === "success") {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })

  const saveRate = async (row: GuestMealRateRow) => {
    const result = await upsertGuestMealRate(row)
    if (result.status === "success") toast.success(result.message)
    else toast.error(result.message)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Non-veg priority</CardTitle>
          <CardDescription>
            Richest first. A guest may book the item scheduled for that meal, or
            anything below it — never anything above. Veg always stays
            available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {values.nonVegPriority
            .filter((type) => type !== "NONE")
            .map((type, index) => (
              <div
                key={type}
                className="bg-card flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-6 text-sm tabular-nums">
                    {index + 1}
                  </span>
                  <span className="font-medium">{prettify(type)}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`Move ${prettify(type)} up`}
                    disabled={index === 0}
                    onClick={() => movePriority(index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`Move ${prettify(type)} down`}
                    disabled={
                      index ===
                      values.nonVegPriority.filter((t) => t !== "NONE").length -
                        1
                    }
                    onClick={() => movePriority(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest meal rules</CardTitle>
          <CardDescription>
            These are enforced when a booking is submitted, not only in the
            form.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {NUMBER_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={field.key}
                  type="number"
                  inputMode="numeric"
                  value={values[field.key]}
                  onChange={(event) => setNumber(field.key, event.target.value)}
                />
                {field.suffix && (
                  <span className="text-muted-foreground text-sm whitespace-nowrap">
                    {field.suffix}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {field.hint}
                {(field.key === "lunchStartMinute" ||
                  field.key === "dinnerStartMinute") &&
                  ` Currently ${minuteLabel(values[field.key])}.`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest meal rates</CardTitle>
          <CardDescription>
            Overrides the menu item cost. Leave a row unset to keep using the
            menu item price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-40 text-right">Amount (₹)</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground text-sm"
                    >
                      No rates configured — menu item prices are used.
                    </TableCell>
                  </TableRow>
                ) : (
                  rateRows.map((row, index) => (
                    <TableRow
                      key={`${row.mealTime}-${row.type}-${row.nonVegType}`}
                    >
                      <TableCell>{prettify(row.mealTime)}</TableCell>
                      <TableCell>
                        {row.type === "VEG" ? "Veg" : prettify(row.nonVegType)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="text-right"
                          value={row.amount}
                          onChange={(event) => {
                            const next = [...rateRows]
                            next[index] = {
                              ...row,
                              amount: Number(event.target.value) || 0,
                            }
                            setRateRows(next)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => saveRate(rateRows[index] ?? row)}
                        >
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <LoadingButton loading={isSaving} onClick={save}>
          Save settings
        </LoadingButton>
        <LoadingButton
          loading={isResetting}
          variant="outline"
          onClick={reset}
          disabled={isSaving}
        >
          Restore defaults
        </LoadingButton>
      </div>
    </div>
  )
}
