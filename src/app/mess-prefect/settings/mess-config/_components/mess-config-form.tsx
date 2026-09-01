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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
  defaults: Pick<
    MessConfigInput,
    "guestBookingMaxDaysAhead" | "guestBookingCutoffMinutes"
  >
}

type Option = { value: number; label: string }

const HORIZON_OPTIONS: Option[] = [
  { value: 0, label: "Today only" },
  { value: 1, label: "1 day ahead" },
  { value: 2, label: "2 days ahead" },
  { value: 3, label: "3 days ahead" },
  { value: 7, label: "1 week ahead" },
  { value: 14, label: "2 weeks ahead" },
  { value: 30, label: "1 month ahead" },
]

const CUTOFF_OPTIONS: Option[] = [
  { value: 0, label: "At slot start (no early cutoff)" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 90, label: "1.5 hours before" },
  { value: 120, label: "2 hours before" },
  { value: 180, label: "3 hours before" },
]

const LOCK_OPTIONS: Option[] = [
  { value: 0, label: "No lock" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 360, label: "6 hours" },
]

function minuteToInputTime(minute: number) {
  const h = Math.floor(minute / 60) % 24
  const m = minute % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function inputTimeToMinute(value: string) {
  const [h, m] = value.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

function prettify(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function PresetSelect({
  id,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string
  value: number
  options: Option[]
  onChange: (value: number) => void
  disabled?: boolean
}) {
  const list = options.some((o) => o.value === value)
    ? options
    : [...options, { value, label: String(value) }].sort(
        (a, b) => a.value - b.value
      )

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {list.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DefaultableSelectField({
  id,
  label,
  hint,
  value,
  defaultValue,
  options,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: number
  defaultValue: number
  options: Option[]
  onChange: (value: number) => void
}) {
  const [isCustom, setIsCustom] = useState(value !== defaultValue)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {isCustom ? "Custom" : "Default"}
          </span>
          <Switch
            checked={isCustom}
            onCheckedChange={(checked) => {
              setIsCustom(checked)
              if (!checked) onChange(defaultValue)
            }}
          />
        </div>
      </div>
      <PresetSelect
        id={id}
        value={value}
        options={options}
        onChange={onChange}
        disabled={!isCustom}
      />
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )
}

function CapField({
  id,
  label,
  unit,
  hint,
  value,
  defaultValue,
  onChange,
}: {
  id: string
  label: string
  unit: string
  hint: string
  value: number
  defaultValue: number
  onChange: (value: number) => void
}) {
  const enabled = value > 0

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            onChange(checked ? (value > 0 ? value : defaultValue) : 0)
          }
        />
      </div>
      {enabled ? (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={1}
            value={value}
            onChange={(event) =>
              onChange(Math.max(1, Number(event.target.value) || 1))
            }
            className="w-28"
          />
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            {unit}
          </span>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No limit — guests can book any number.
        </p>
      )}
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )
}

export function MessConfigForm({
  config,
  rates,
  defaults,
}: MessConfigFormProps) {
  const [values, setValues] = useState<MessConfigInput>(() => ({
    ...config,
    guestBookingMaxDaysAhead: Math.max(0, config.guestBookingMaxDaysAhead),
  }))
  const [rateRows, setRateRows] = useState(rates)
  const [isSaving, startSaving] = useTransition()
  const [isResetting, startResetting] = useTransition()

  const set = (key: keyof MessConfigInput, value: number) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const movePriority = (index: number, direction: -1 | 1) => {
    const target = index + direction
    const next = [...values.nonVegPriority]
    if (target < 0 || target >= next.length) return
    const [moved] = next.splice(index, 1)
    if (!moved) return
    next.splice(target, 0, moved)
    setValues({ ...values, nonVegPriority: next })
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
          <CardTitle>When can guests book?</CardTitle>
          <CardDescription>
            Control how far ahead and how late a guest meal can be booked.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DefaultableSelectField
            id="horizon"
            label="How far ahead can guests book?"
            hint="How early a guest meal can be reserved in advance."
            value={values.guestBookingMaxDaysAhead}
            defaultValue={defaults.guestBookingMaxDaysAhead}
            options={HORIZON_OPTIONS}
            onChange={(v) => set("guestBookingMaxDaysAhead", v)}
          />

          <DefaultableSelectField
            id="cutoff"
            label="Booking closes"
            hint="Same-day bookings stop this long before the meal starts."
            value={values.guestBookingCutoffMinutes}
            defaultValue={defaults.guestBookingCutoffMinutes}
            options={CUTOFF_OPTIONS}
            onChange={(v) => set("guestBookingCutoffMinutes", v)}
          />

          <div className="space-y-1.5">
            <Label htmlFor="lunch">Lunch starts at</Label>
            <Input
              id="lunch"
              type="time"
              value={minuteToInputTime(values.lunchStartMinute)}
              onChange={(event) =>
                set("lunchStartMinute", inputTimeToMinute(event.target.value))
              }
            />
            <p className="text-muted-foreground text-xs">
              The time the lunch slot opens.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dinner">Dinner starts at</Label>
            <Input
              id="dinner"
              type="time"
              value={minuteToInputTime(values.dinnerStartMinute)}
              onChange={(event) =>
                set("dinnerStartMinute", inputTimeToMinute(event.target.value))
              }
            />
            <p className="text-muted-foreground text-xs">
              The time the dinner slot opens.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How many guest meals are allowed?</CardTitle>
          <CardDescription>
            Turn a limit off to allow any number, or turn it on to set a cap.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <CapField
            id="maxGuestsPerBooking"
            label="Limit guests per booking"
            unit="meals per booking"
            hint="The most guest meals allowed in a single request."
            value={values.maxGuestsPerBooking}
            defaultValue={5}
            onChange={(v) => set("maxGuestsPerBooking", v)}
          />
          <CapField
            id="maxGuestMealsPerUserPerMonth"
            label="Limit monthly quota per boarder"
            unit="meals per month"
            hint="The most guest meals one boarder can book in a month."
            value={values.maxGuestMealsPerUserPerMonth}
            defaultValue={20}
            onChange={(v) => set("maxGuestMealsPerUserPerMonth", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meal preference lock</CardTitle>
          <CardDescription>
            How long boarders are stopped from changing their meal preference
            after a count is generated.
          </CardDescription>
        </CardHeader>
        <CardContent className="sm:max-w-xs">
          <PresetSelect
            id="preferenceLock"
            value={values.mealPreferenceLockMinutes}
            options={LOCK_OPTIONS}
            onChange={(v) => set("mealPreferenceLockMinutes", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest meal pricing</CardTitle>
          <CardDescription>
            Rates override the menu item cost. Leave a row unset to keep using
            the menu item price.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor="fallbackCharge">Fallback charge</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">₹</span>
              <Input
                id="fallbackCharge"
                type="number"
                inputMode="numeric"
                min={0}
                value={values.guestMealFallbackCharge}
                onChange={(event) =>
                  set(
                    "guestMealFallbackCharge",
                    Math.max(0, Number(event.target.value) || 0)
                  )
                }
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Charged when no rate below and no menu item cost is configured.
            </p>
          </div>

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
