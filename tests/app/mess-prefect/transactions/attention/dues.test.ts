import { describe, expect, it } from "vitest"

import { settleDues } from "@/app/mess-prefect/transactions/attention/_lib/dues"

const NOW = new Date("2026-09-08T06:00:00.000Z")
const AUG_24 = new Date("2026-08-24T00:00:00.000Z")
const JUL_24 = new Date("2026-07-24T00:00:00.000Z")
const OCT_24 = new Date("2026-10-24T00:00:00.000Z")

const charge = (amount: number, dueDate: Date | null, issued = dueDate) => ({
  amount,
  dueDate,
  issueDate: issued ?? NOW,
})
const credit = (amount: number, issued = NOW) => ({
  amount: -amount,
  dueDate: null,
  issueDate: issued,
})

describe("settleDues", () => {
  it("nets charges against credits for the outstanding balance", () => {
    const position = settleDues([charge(2159, AUG_24), credit(2000)], NOW)
    expect(position.outstanding).toBe(159)
  })

  it("reports a boarder who paid in full as owing nothing", () => {
    // Sourav Panda: paid 4127 against 4127 of charges, yet the page listed him
    // with one overdue bill of 2159 because no charge row is ever marked paid.
    const position = settleDues(
      [charge(2159, AUG_24), charge(1968, JUL_24), credit(4127)],
      NOW
    )

    expect(position.outstanding).toBe(0)
    expect(position.overdueAmount).toBe(0)
    expect(position.overdueCount).toBe(0)
    expect(position.oldestDueDate).toBeNull()
  })

  it("reports a boarder in credit as owing nothing", () => {
    // Abdus Samad Anjum: 41 in credit, still chased for 2159.
    const position = settleDues([charge(4015, AUG_24), credit(4056)], NOW)

    expect(position.outstanding).toBe(-41)
    expect(position.overdueAmount).toBe(0)
    expect(position.overdueCount).toBe(0)
  })

  it("counts only the part a payment did not cover", () => {
    // SUBHODIP MONDAL: 2000 paid against a 2159 August bill.
    const position = settleDues([charge(2159, AUG_24), credit(2000)], NOW)

    expect(position.overdueAmount).toBe(159)
    expect(position.overdueCount).toBe(1)
    expect(position.oldestDueDate).toEqual(AUG_24)
  })

  it("settles the oldest charge first", () => {
    const position = settleDues(
      [charge(1000, AUG_24), charge(1000, JUL_24), credit(1000)],
      NOW
    )

    // July is cleared, so only August is left owing and it sets the date.
    expect(position.overdueAmount).toBe(1000)
    expect(position.overdueCount).toBe(1)
    expect(position.oldestDueDate).toEqual(AUG_24)
  })

  it("does not treat a charge that has not fallen due as overdue", () => {
    const position = settleDues([charge(2159, OCT_24)], NOW)

    expect(position.outstanding).toBe(2159)
    expect(position.overdueAmount).toBe(0)
    expect(position.overdueCount).toBe(0)
    expect(position.oldestDueDate).toBeNull()
  })

  it("never counts a charge with no due date as overdue", () => {
    const position = settleDues([charge(500, null)], NOW)

    expect(position.outstanding).toBe(500)
    expect(position.overdueCount).toBe(0)
  })

  it("does not leave a rounding crumb behind as a debt", () => {
    const position = settleDues(
      [charge(0.1, AUG_24), charge(0.2, AUG_24), credit(0.3)],
      NOW
    )

    expect(position.overdueAmount).toBe(0)
    expect(position.overdueCount).toBe(0)
  })

  it("keeps surplus credit from making a later charge negative", () => {
    const position = settleDues(
      [charge(100, JUL_24), credit(1000), charge(200, AUG_24)],
      NOW
    )

    expect(position.outstanding).toBe(-700)
    expect(position.overdueAmount).toBe(0)
    expect(position.overdueCount).toBe(0)
  })

  it("handles an empty ledger", () => {
    expect(settleDues([], NOW)).toEqual({
      outstanding: 0,
      overdueAmount: 0,
      overdueCount: 0,
      oldestDueDate: null,
    })
  })
})
