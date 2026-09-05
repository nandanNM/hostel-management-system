import { describe, expect, it } from "vitest"

import {
  buildMonthlyMealRows,
  filterAndSortRows,
  paginateRows,
  resolveReportMonth,
  shiftMonth,
  sumMonthlyMeals,
  type MonthlyMealRow,
  type ReportUser,
} from "@/app/manager/reports/monthly-meals/_lib/aggregate"

const users: ReportUser[] = [
  {
    id: "u1",
    name: "Nandan",
    email: "nandan@example.com",
    image: null,
    roomNo: "12",
    status: "ACTIVE",
  },
  {
    id: "u2",
    name: "Deep Mandal",
    email: "deep@example.com",
    image: null,
    roomNo: "07",
    status: "ACTIVE",
  },
  {
    id: "u3",
    name: "Ismail Ali",
    email: "ismail@example.com",
    image: null,
    roomNo: "03",
    status: "SUSPENDED",
  },
]

describe("buildMonthlyMealRows", () => {
  it("splits attendance into lunch and dinner and adds guest meals", () => {
    const rows = buildMonthlyMealRows(
      users,
      [
        { userId: "u1", mealTime: "LUNCH", count: 26 },
        { userId: "u1", mealTime: "DINNER", count: 24 },
        { userId: "u2", mealTime: "LUNCH", count: 30 },
      ],
      [{ userId: "u1", meals: 3 }]
    )

    const nandan = rows.find((r) => r.userId === "u1")!
    expect(nandan).toMatchObject({ lunch: 26, dinner: 24, guest: 3, total: 53 })

    const deep = rows.find((r) => r.userId === "u2")!
    expect(deep).toMatchObject({ lunch: 30, dinner: 0, guest: 0, total: 30 })
  })

  it("keeps boarders with no meals at all", () => {
    const rows = buildMonthlyMealRows(users, [], [])
    expect(rows).toHaveLength(3)
    expect(rows.every((r) => r.total === 0)).toBe(true)
  })

  it("counts guest meals even with no attendance", () => {
    const rows = buildMonthlyMealRows(users, [], [{ userId: "u3", meals: 2 }])
    expect(rows.find((r) => r.userId === "u3")).toMatchObject({
      lunch: 0,
      dinner: 0,
      guest: 2,
      total: 2,
    })
  })
})

describe("sumMonthlyMeals", () => {
  it("totals every column across boarders", () => {
    const rows = buildMonthlyMealRows(
      users,
      [
        { userId: "u1", mealTime: "LUNCH", count: 10 },
        { userId: "u2", mealTime: "DINNER", count: 5 },
      ],
      [{ userId: "u1", meals: 2 }]
    )

    expect(sumMonthlyMeals(rows)).toEqual({
      boarders: 3,
      lunch: 10,
      dinner: 5,
      guest: 2,
      total: 17,
    })
  })
})

const sample: MonthlyMealRow[] = [
  {
    userId: "u1",
    name: "Nandan",
    email: "nandan@example.com",
    image: null,
    roomNo: "12",
    status: "ACTIVE",
    lunch: 26,
    dinner: 24,
    guest: 3,
    total: 53,
  },
  {
    userId: "u2",
    name: "Deep Mandal",
    email: "deep@example.com",
    image: null,
    roomNo: "07",
    status: "ACTIVE",
    lunch: 30,
    dinner: 28,
    guest: 0,
    total: 58,
  },
  {
    userId: "u3",
    name: "Ismail Ali",
    email: "ismail@example.com",
    image: null,
    roomNo: "03",
    status: "SUSPENDED",
    lunch: 4,
    dinner: 2,
    guest: 0,
    total: 6,
  },
]

describe("filterAndSortRows", () => {
  it("sorts by total descending by default", () => {
    expect(filterAndSortRows(sample, {}).map((r) => r.userId)).toEqual([
      "u2",
      "u1",
      "u3",
    ])
  })

  it("sorts by any numeric column in either direction", () => {
    expect(filterAndSortRows(sample, { sort: "guest.desc" })[0]?.userId).toBe(
      "u1"
    )
    expect(filterAndSortRows(sample, { sort: "lunch.asc" })[0]?.userId).toBe(
      "u3"
    )
  })

  it("sorts names alphabetically, not numerically", () => {
    expect(filterAndSortRows(sample, { sort: "name.asc" })[0]?.name).toBe(
      "Deep Mandal"
    )
  })

  it("searches name, email and room", () => {
    expect(filterAndSortRows(sample, { search: "deep" })).toHaveLength(1)
    expect(filterAndSortRows(sample, { search: "ismail@" })).toHaveLength(1)
    expect(filterAndSortRows(sample, { search: "12" })).toHaveLength(1)
    expect(filterAndSortRows(sample, { search: "  DEEP  " })).toHaveLength(1)
  })

  it("filters by status", () => {
    expect(filterAndSortRows(sample, { statuses: ["ACTIVE"] })).toHaveLength(2)
    expect(filterAndSortRows(sample, { statuses: [] })).toHaveLength(3)
  })

  it("does not mutate the rows it is given", () => {
    const order = sample.map((r) => r.userId)
    filterAndSortRows(sample, { sort: "total.asc" })
    expect(sample.map((r) => r.userId)).toEqual(order)
  })
})

describe("paginateRows", () => {
  it("slices the requested page", () => {
    const { data, pageCount } = paginateRows(sample, 2, 2)
    expect(pageCount).toBe(2)
    expect(data).toHaveLength(1)
  })

  it("clamps a page beyond the end instead of returning nothing", () => {
    expect(paginateRows(sample, 99, 2).data).toHaveLength(1)
  })

  it("reports one page for an empty report", () => {
    expect(paginateRows([], 1, 20)).toEqual({ data: [], pageCount: 1 })
  })
})

describe("resolveReportMonth", () => {
  const fallback = { year: 2026, month: 7 }

  it("converts a valid 1-based month to 0-based", () => {
    expect(resolveReportMonth({ year: "2026", month: "3" }, fallback)).toEqual({
      year: 2026,
      month: 2,
    })
  })

  it("falls back on junk, missing or out-of-range input", () => {
    expect(resolveReportMonth({}, fallback)).toEqual(fallback)
    expect(resolveReportMonth({ year: "abc", month: "3" }, fallback)).toEqual(
      fallback
    )
    expect(resolveReportMonth({ year: "2026", month: "13" }, fallback)).toEqual(
      fallback
    )
    expect(resolveReportMonth({ year: "1999", month: "1" }, fallback)).toEqual(
      fallback
    )
  })
})

describe("shiftMonth", () => {
  it("rolls backwards and forwards across years", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 })
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 })
    expect(shiftMonth(2026, 7, -12)).toEqual({ year: 2025, month: 7 })
  })
})
