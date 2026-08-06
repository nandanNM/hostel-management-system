"use server"

import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"

import { BillEntryType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

export async function getTransactionsOverview() {
  await requireMessPrefect()

  const [bills, recent] = await Promise.all([
    prisma.userBill.findMany({
      select: { type: true, amount: true, isPaid: true },
    }),
    prisma.userBill.findMany({
      orderBy: { issueDate: "desc" },
      take: 12,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        issueDate: true,
        user: { select: { name: true } },
      },
    }),
  ])

  let meal = 0
  let guest = 0
  let fine = 0
  let other = 0
  let collected = 0
  let outstanding = 0

  for (const bill of bills) {
    switch (bill.type) {
      case BillEntryType.MEAL_CHARGE:
        meal += bill.amount
        break
      case BillEntryType.GUEST_MEAL_CHARGE:
        guest += bill.amount
        break
      case BillEntryType.FINE_CHARGE:
        fine += bill.amount
        break
      case BillEntryType.SECURITY_DEPOSIT:
      case BillEntryType.ADJUSTMENT_DEBIT:
        other += bill.amount
        break
      case BillEntryType.PAYMENT:
      case BillEntryType.REFUND:
      case BillEntryType.ADJUSTMENT_CREDIT:
        collected += Math.abs(bill.amount)
        break
    }
    if (bill.amount > 0 && !bill.isPaid) outstanding += bill.amount
  }

  const totalCharges = meal + guest + fine + other

  const breakdown = [
    { category: "meal", label: "Meal charges", amount: meal },
    { category: "guest", label: "Guest meals", amount: guest },
    { category: "fine", label: "Fines", amount: fine },
    { category: "other", label: "Other", amount: other },
  ].filter((slice) => slice.amount > 0)

  return {
    totalCharges,
    totalCollected: collected,
    totalOutstanding: outstanding,
    totalFines: fine,
    breakdown,
    recent: recent.map((bill) => ({
      id: bill.id,
      type: bill.type,
      amount: bill.amount,
      description: bill.description,
      issueDate: bill.issueDate,
      userName: bill.user.name,
    })),
  }
}
