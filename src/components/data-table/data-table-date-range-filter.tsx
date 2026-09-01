"use client"

import { useState } from "react"
import { getLocalTimeZone, parseDate, today } from "@internationalized/date"
import { CalendarBlank, X } from "@phosphor-icons/react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { RangeCalendar } from "@/components/ui/calendar-rac"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DataTableDateRange {
  from: string
  to: string
}

interface DataTableDateRangeFilterProps {
  from?: string
  to?: string
  onChange: (range: DataTableDateRange | null) => void
  placeholder?: string
}

function formatRangeLabel(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (from === to) return format(start, "dd MMM yyyy")
  return `${format(start, "dd MMM")} – ${format(end, "dd MMM yyyy")}`
}

export function DataTableDateRangeFilter({
  from,
  to,
  onChange,
  placeholder = "Custom range",
}: DataTableDateRangeFilterProps) {
  const value =
    from && to ? { start: parseDate(from), end: parseDate(to) } : null
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={value ? "default" : "outline"}
          size="sm"
          className="h-9 gap-1.5"
        >
          <CalendarBlank className="h-4 w-4" />
          {value ? formatRangeLabel(from!, to!) : placeholder}
          {value && (
            <X
              className="ml-1 h-3.5 w-3.5"
              onClick={(event) => {
                event.stopPropagation()
                onChange(null)
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <RangeCalendar
          value={value}
          maxValue={today(getLocalTimeZone())}
          onChange={(range) => {
            if (!range) return
            onChange({ from: range.start.toString(), to: range.end.toString() })
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
