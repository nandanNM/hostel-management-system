import { addDays, subDays } from "date-fns"
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"

/**
 * The single timezone this app reasons in.
 *
 * Everything is stored in the database as an absolute UTC instant, but every
 * *calendar* decision (which day is "today", which day a birthday falls on,
 * which day a log belongs to) must be made in India time. The server runs in
 * UTC on Vercel, so `new Date().getDate()`, `startOfDay()`, `format()` and
 * friends are all off by up to 5h30m there and silently render/query the
 * previous day. Use the helpers below instead of the raw date-fns ones.
 */
export const IST = "Asia/Kolkata"

/** Format an instant using India time, regardless of where the code runs. */
export function formatIST(
  date: Date | string | number,
  fmt: string = "dd MMM yyyy"
) {
  return formatInTimeZone(new Date(date), IST, fmt)
}

/** `yyyy-MM-dd` of an instant, as seen in India. */
export function istYmd(date: Date | string | number = new Date()) {
  return formatIST(date, "yyyy-MM-dd")
}

/** The calendar parts of an instant, as seen in India (`month` is 0-based). */
export function istParts(date: Date | string | number = new Date()) {
  const [year, month, day] = istYmd(date).split("-").map(Number)
  return {
    year: year as number,
    month: (month as number) - 1,
    day: day as number,
  }
}

/** The instant at which the India day containing `date` begins (00:00 IST). */
export function istStartOfDay(date: Date | string | number = new Date()) {
  return fromZonedTime(`${istYmd(date)}T00:00:00.000`, IST)
}

/** The last instant of the India day containing `date` (23:59:59.999 IST). */
export function istEndOfDay(date: Date | string | number = new Date()) {
  return fromZonedTime(`${istYmd(date)}T23:59:59.999`, IST)
}

/** 00:00 IST of the India day `days` before the India day of `date`. */
export function istStartOfDaysAgo(
  days: number,
  date: Date | string | number = new Date()
) {
  return istStartOfDay(subDays(istStartOfDay(date), days))
}

/** 00:00 IST of the 1st of the given India month (`month` is 0-based). */
export function istStartOfMonth(year: number, month: number) {
  const mm = String(month + 1).padStart(2, "0")
  return fromZonedTime(`${year}-${mm}-01T00:00:00.000`, IST)
}

/** The first instant of the *next* India month — use as an exclusive upper bound. */
export function istStartOfNextMonth(year: number, month: number) {
  return month === 11
    ? istStartOfMonth(year + 1, 0)
    : istStartOfMonth(year, month + 1)
}

/** The last instant of the given India month (inclusive upper bound). */
export function istEndOfMonth(year: number, month: number) {
  return new Date(istStartOfNextMonth(year, month).getTime() - 1)
}

/**
 * The day-key for a date-only column: UTC midnight of the India calendar day.
 *
 * This is the convention already in the database for `date` columns
 * (`daily_meal_activities.meal_date`, `guest_meals.date`,
 * `meal_attendances.date`), because the old code did
 * `startOfDay(toZonedTime(now, IST))` on a UTC server. Keeping the same
 * convention means existing rows keep matching; the difference is that this
 * helper produces the same value no matter what timezone the process runs in,
 * so local (IST) development and Vercel (UTC) finally agree.
 */
export function istCalendarDay(date: Date | string | number = new Date()) {
  return new Date(`${istYmd(date)}T00:00:00.000Z`)
}

/** Exclusive upper bound companion to {@link istCalendarDay}. */
export function istCalendarDayEnd(date: Date | string | number = new Date()) {
  return new Date(`${istYmd(date)}T23:59:59.999Z`)
}

/** UTC midnight of the 1st of the given India month (`month` is 0-based). */
export function istCalendarMonthStart(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1))
}

/** Last millisecond of the given India month, in the day-key convention. */
export function istCalendarMonthEnd(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 1) - 1)
}

/**
 * Normalise a date-only value (date of birth, a picked calendar day) to the
 * India calendar day the user actually picked.
 *
 * A calendar widget hands back the browser's local midnight, which serialises
 * to e.g. `2004-04-21T18:30:00Z` for a user who picked the 22nd in India.
 * Stored raw, a UTC server then renders "21". Normalising here — and reading
 * with {@link formatIST} — makes both old and new rows show the 22nd.
 */
export function istDateOnly(date: Date | string | number) {
  return istCalendarDay(date)
}

/**
 * A `Date` whose local fields read as India wall-clock time.
 *
 * Only for the rare case where you need `getMonth()`/`getDate()` style access
 * on India time. Never write one of these back to the database and never pass
 * one to a Prisma filter — it is not a real instant.
 */
export function istWallClock(date: Date | string | number = new Date()) {
  return toZonedTime(new Date(date), IST)
}

/** Inclusive/exclusive instant bounds for a run of India days ending today. */
export function istRangeLastDays(days: number) {
  const now = new Date()
  return {
    from: istStartOfDaysAgo(Math.max(0, days - 1), now),
    to: addDays(istStartOfDay(now), 1),
  }
}
