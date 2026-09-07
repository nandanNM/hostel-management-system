/**
 * Working out what a boarder still owes, and how much of it is late.
 *
 * The ledger is a running account, not a set of settled invoices: a charge is
 * a positive row, a payment or credit a negative one, and nothing ties a
 * payment to the bill it settles. `isPaid` is only ever true on the credit
 * rows themselves - no charge row is ever flipped - so reading it to find
 * unpaid bills returns every charge ever raised, including those of boarders
 * who have paid in full.
 *
 * Credits are therefore applied oldest charge first. Whatever is left
 * uncovered is what the boarder actually still owes, and the part of that
 * which is past its due date is what is overdue.
 */

/** Fractions of a paisa left by float arithmetic are not a debt. */
const EPSILON = 0.005

export type LedgerEntry = {
  /** Positive for a charge, negative for a payment, refund or credit. */
  amount: number
  dueDate: Date | null
  issueDate: Date
}

export type DuesPosition = {
  /** Net of every charge and credit. Negative means the boarder is in credit. */
  outstanding: number
  /** Past-due charges not covered by any credit. */
  overdueAmount: number
  overdueCount: number
  oldestDueDate: Date | null
}

/** Oldest first, by when it fell due, or when it was raised if it never did. */
function chargeOrder(entry: LedgerEntry): number {
  return (entry.dueDate ?? entry.issueDate).getTime()
}

export function settleDues(
  entries: LedgerEntry[],
  now: Date = new Date()
): DuesPosition {
  let outstanding = 0
  let credit = 0
  const charges: LedgerEntry[] = []

  for (const entry of entries) {
    outstanding += entry.amount
    if (entry.amount < 0) credit += -entry.amount
    else if (entry.amount > 0) charges.push(entry)
  }

  charges.sort((a, b) => chargeOrder(a) - chargeOrder(b))

  let overdueAmount = 0
  let overdueCount = 0
  let oldestDueDate: Date | null = null

  for (const charge of charges) {
    const covered = Math.min(credit, charge.amount)
    credit -= covered
    const owed = charge.amount - covered

    if (owed <= EPSILON) continue
    // Still owed, but not yet late.
    if (!charge.dueDate || charge.dueDate >= now) continue

    overdueAmount += owed
    overdueCount += 1
    if (!oldestDueDate || charge.dueDate < oldestDueDate) {
      oldestDueDate = charge.dueDate
    }
  }

  return { outstanding, overdueAmount, overdueCount, oldestDueDate }
}
