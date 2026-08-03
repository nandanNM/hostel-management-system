import { MealTimeType } from "@/lib/generated/prisma"

export type ReportUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  roomNo: string | null
  status: string
}

export type AttendanceGroup = {
  userId: string
  mealTime: MealTimeType
  count: number
}

export type GuestGroup = {
  userId: string
  meals: number
}

export type MonthlyMealRow = {
  userId: string
  name: string
  email: string | null
  image: string | null
  roomNo: string | null
  status: string
  lunch: number
  dinner: number
  guest: number
  /** Lunch + dinner + guest: what the mess cooked on this boarder's account. */
  total: number
}

export type MonthlyMealTotals = {
  boarders: number
  lunch: number
  dinner: number
  guest: number
  total: number
}

/**
 * One row per boarder for the month.
 *
 * Attendance is grouped by user *and* slot, so it arrives as up to two rows per
 * boarder; guest meals arrive as a summed count. Everyone active appears, even
 * with nothing recorded - a boarder with zero meals is a fact worth seeing, not
 * a row to hide.
 */
export function buildMonthlyMealRows(
  users: ReportUser[],
  attendance: AttendanceGroup[],
  guests: GuestGroup[]
): MonthlyMealRow[] {
  const lunchByUser = new Map<string, number>()
  const dinnerByUser = new Map<string, number>()

  for (const row of attendance) {
    const target =
      row.mealTime === MealTimeType.LUNCH ? lunchByUser : dinnerByUser
    target.set(row.userId, (target.get(row.userId) ?? 0) + row.count)
  }

  const guestByUser = new Map(guests.map((g) => [g.userId, g.meals]))

  return users.map((user) => {
    const lunch = lunchByUser.get(user.id) ?? 0
    const dinner = dinnerByUser.get(user.id) ?? 0
    const guest = guestByUser.get(user.id) ?? 0

    return {
      userId: user.id,
      name: user.name ?? "Unknown",
      email: user.email,
      image: user.image,
      roomNo: user.roomNo,
      status: user.status,
      lunch,
      dinner,
      guest,
      total: lunch + dinner + guest,
    }
  })
}

/** Month totals, from the same rows - no second trip to the database. */
export function sumMonthlyMeals(rows: MonthlyMealRow[]): MonthlyMealTotals {
  return rows.reduce<MonthlyMealTotals>(
    (acc, row) => ({
      boarders: acc.boarders + 1,
      lunch: acc.lunch + row.lunch,
      dinner: acc.dinner + row.dinner,
      guest: acc.guest + row.guest,
      total: acc.total + row.total,
    }),
    { boarders: 0, lunch: 0, dinner: 0, guest: 0, total: 0 }
  )
}

/** Clamp a `?year=&month=` pair, falling back to the given India month. */
export function resolveReportMonth(
  input: { year?: string; month?: string },
  fallback: { year: number; month: number }
): { year: number; month: number } {
  const year = Number(input.year)
  const month = Number(input.month)

  const valid =
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 2100 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12

  // `month` is 1-based in the URL and 0-based everywhere in lib/date.
  return valid
    ? { year, month: month - 1 }
    : { year: fallback.year, month: fallback.month }
}

/** Step a 0-based India month by `by` months, rolling the year. */
export function shiftMonth(
  year: number,
  month: number,
  by: number
): { year: number; month: number } {
  const total = year * 12 + month + by
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

export type SortableColumn = keyof Pick<
  MonthlyMealRow,
  "name" | "roomNo" | "status" | "lunch" | "dinner" | "guest" | "total"
>

/**
 * Search, faceted status filter, then sort - all in memory.
 *
 * The report is one row per boarder (a hostel, not a social network), and the
 * month totals have to cover every row anyway, so paginating in the database
 * would mean a second pass for the totals and would make "sort by total"
 * impossible without raw SQL.
 */
export function filterAndSortRows(
  rows: MonthlyMealRow[],
  options: { search?: string; statuses?: string[]; sort?: string }
): MonthlyMealRow[] {
  const search = options.search?.trim().toLowerCase()
  const statuses = options.statuses ?? []

  let result = rows

  if (search) {
    result = result.filter(
      (row) =>
        row.name.toLowerCase().includes(search) ||
        (row.email ?? "").toLowerCase().includes(search) ||
        (row.roomNo ?? "").toLowerCase().includes(search)
    )
  }

  if (statuses.length > 0) {
    result = result.filter((row) => statuses.includes(row.status))
  }

  const [field, direction] = (options.sort?.split(".") ?? []) as [
    SortableColumn | undefined,
    "asc" | "desc" | undefined,
  ]

  const sortField: SortableColumn = field ?? "total"
  const desc = (direction ?? "desc") === "desc"

  // Copy first: callers pass the cached row list.
  return [...result].sort((a, b) => {
    const left = a[sortField]
    const right = b[sortField]

    const comparison =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left ?? "").localeCompare(String(right ?? ""))

    return desc ? -comparison : comparison
  })
}

/** Slice a page, 1-based, and report how many pages there are. */
export function paginateRows(
  rows: MonthlyMealRow[],
  page: number,
  perPage: number
): { data: MonthlyMealRow[]; pageCount: number } {
  const size = Math.max(1, perPage)
  const pageCount = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(Math.max(1, page), pageCount)
  const offset = (current - 1) * size

  return { data: rows.slice(offset, offset + size), pageCount }
}
