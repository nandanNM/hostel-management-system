"use client"

import { parseAsString, useQueryStates } from "nuqs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DataTableDateRangeFilter,
  type DataTableDateRange,
} from "@/components/data-table/data-table-date-range-filter"

import {
  DEFAULT_PRESET,
  RANGE_PRESETS,
  type RangePreset,
} from "../_lib/validations"

interface TransactionsRangeFilterProps {
  preset: RangePreset | "custom"
  from?: string
  to?: string
  /** The resolved window, shown on the calendar button while a preset is on. */
  rangeLabel: string
}

/**
 * Preset dropdown plus the shared range calendar. Both write `range`/`from`/
 * `to` to the URL with `shallow: false`, so the server component re-runs its
 * queries for the new window.
 */
export function TransactionsRangeFilter({
  preset,
  from,
  to,
  rangeLabel,
}: TransactionsRangeFilterProps) {
  const [, setParams] = useQueryStates(
    {
      range: parseAsString,
      from: parseAsString,
      to: parseAsString,
    },
    { history: "replace", shallow: false, scroll: false }
  )

  const isCustom = preset === "custom"

  function handlePreset(value: string) {
    if (value === "custom") return
    void setParams({
      range: value === DEFAULT_PRESET ? null : value,
      from: null,
      to: null,
    })
  }

  function handleRange(next: DataTableDateRange | null) {
    if (!next) {
      void setParams({ range: null, from: null, to: null })
      return
    }
    void setParams({ range: "custom", from: next.from, to: next.to })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onValueChange={handlePreset}>
        <SelectTrigger size="sm" className="h-9 w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(RANGE_PRESETS).map(([key, option]) => (
            <SelectItem key={key} value={key}>
              {option.label}
            </SelectItem>
          ))}
          {isCustom && (
            <SelectItem value="custom" disabled>
              Custom range
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <DataTableDateRangeFilter
        from={isCustom ? from : undefined}
        to={isCustom ? to : undefined}
        placeholder={rangeLabel}
        onChange={handleRange}
      />
    </div>
  )
}
