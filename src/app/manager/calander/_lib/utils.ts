import {
  parse,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from "date-fns"

import { Feature, Status } from "@/components/calendar"

function setTime(date: Date, hour: number, minute = 0, second = 0, ms = 0) {
  return setHours(
    setMinutes(setSeconds(setMilliseconds(date, ms), second), minute),
    hour
  )
}
const mealStatuses: Status[] = [
  { id: "lunch", name: "Lunch", color: "#f59e0b" },
  { id: "dinner", name: "Dinner", color: "#3b82f6" },
]
type AttendanceSummaryResponse = Record<
  string,
  {
    lunch: string[]
    dinner: string[]
  }
>
export function transformAttendanceToMeals(
  attendance: AttendanceSummaryResponse
): Feature[] {
  return Object.entries(attendance).flatMap(([dateStr, { lunch, dinner }]) => {
    const baseDate = parse(dateStr, "yyyy-MM-dd", new Date())

    return [
      {
        id: `lunch-${dateStr}`,
        name: `Lunch (${lunch.length} meals)`,
        startAt: setTime(baseDate, 0),
        endAt: setTime(baseDate, 12),
        status: mealStatuses[0] as Status,
      },
      {
        id: `dinner-${dateStr}`,
        name: `Dinner (${dinner.length} meals)`,
        startAt: setTime(baseDate, 12),
        endAt: setTime(baseDate, 23, 59, 59),
        status: mealStatuses[1] as Status,
      },
    ]
  })
}
