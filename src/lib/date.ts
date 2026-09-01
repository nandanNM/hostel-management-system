import { addDays, subDays } from "date-fns"
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"

/**
 * The app stores absolute UTC instants but makes every calendar decision in
 * India time. The server runs in UTC on Vercel, so bare `startOfDay()`,
 * `format()` and `getDate()` are off by up to 5h30m there and silently render
 * or query the previous day. Use these helpers instead.
 */
export const IST = "Asia/Kolkata"

export function formatIST(
  date: Date | string | number,
  fmt: string = "dd MMM yyyy"
) {
  return formatInTimeZone(new Date(date), IST, fmt)
}

export function istYmd(date: Date | string | number = new Date()) {
  return formatIST(date, "yyyy-MM-dd")
}

/** India calendar parts of an instant (`month` is 0-based). */
export function istParts(date: Date | string | number = new Date()) {
  const [year, month, day] = istYmd(date).split("-").map(Number)
  return {
    year: year as number,
    month: (month as number) - 1,
    day: day as number,
  }
}

export function istStartOfDay(date: Date | string | number = new Date()) {
  return fromZonedTime(`${istYmd(date)}T00:00:00.000`, IST)
}

export function istEndOfDay(date: Date | string | number = new Date()) {
  return fromZonedTime(`${istYmd(date)}T23:59:59.999`, IST)
}

export function istStartOfDaysAgo(
  days: number,
  date: Date | string | number = new Date()
) {
  return istStartOfDay(subDays(istStartOfDay(date), days))
}

export function istStartOfMonth(year: number, month: number) {
  const mm = String(month + 1).padStart(2, "0")
  return fromZonedTime(`${year}-${mm}-01T00:00:00.000`, IST)
}

/** Exclusive upper bound for an India month. */
export function istStartOfNextMonth(year: number, month: number) {
  return month === 11
    ? istStartOfMonth(year + 1, 0)
    : istStartOfMonth(year, month + 1)
}

export function istEndOfMonth(year: number, month: number) {
  return new Date(istStartOfNextMonth(year, month).getTime() - 1)
}

/**
 * Day-key for date-only columns: UTC midnight of the India day.
 *
 * This is the convention already in the database (`meal_date`,
 * `guest_meals.date`, `meal_attendances.date`, `audit.date`) because the old
 * code ran `startOfDay(toZonedTime(now, IST))` on a UTC server. Reproducing it
 * exactly keeps existing rows matching, and unlike the old expression the
 * result no longer depends on the process timezone.
 */
export function istCalendarDay(date: Date | string | number = new Date()) {
  return new Date(`${istYmd(date)}T00:00:00.000Z`)
}

export function istCalendarDayEnd(date: Date | string | number = new Date()) {
  return new Date(`${istYmd(date)}T23:59:59.999Z`)
}

export function istCalendarMonthStart(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1))
}

export function istCalendarMonthEnd(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 1) - 1)
}

/**
 * Normalise a picked calendar day (date of birth) to the India day the user
 * actually chose. A calendar hands back browser-local midnight, which for
 * India serialises to the previous day at 18:30Z.
 */
export function istDateOnly(date: Date | string | number) {
  return istCalendarDay(date)
}

/**
 * A `Date` whose local fields read as India wall-clock time, for month/day
 * field access only. Never write one to the database or pass one to Prisma —
 * it is not a real instant.
 */
export function istWallClock(date: Date | string | number = new Date()) {
  return toZonedTime(new Date(date), IST)
}

export function istRangeLastDays(days: number) {
  const now = new Date()
  return {
    from: istStartOfDaysAgo(Math.max(0, days - 1), now),
    to: addDays(istStartOfDay(now), 1),
  }
}

/**
 * Resolves an optional `from`/`to` day-string pair (as picked on a calendar)
 * into an instant range, clamped to at most `maxDays` so a wide-open range
 * can't scan the whole table. Falls back to the last `fallbackDays` when no
 * custom range is given.
 */
export function istResolveLogRange(
  from: string | undefined,
  to: string | undefined,
  { fallbackDays = 7, maxDays = 90 } = {}
) {
  if (from && to) {
    const end = istEndOfDay(to)
    const earliest = istStartOfDaysAgo(maxDays - 1, end)
    const start = istStartOfDay(from)
    return { from: start < earliest ? earliest : start, to: end }
  }
  return {
    from: istStartOfDaysAgo(fallbackDays - 1),
    to: istEndOfDay(new Date()),
  }
}
