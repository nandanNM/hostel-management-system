"use server"

import { unstable_noStore as noStore } from "next/cache"

import { canManage } from "@/lib/authz"
import { istCalendarDay } from "@/lib/date"
import { MealTimeType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"

export type MealSlotCount = {
  mealTime: MealTimeType
  totalMeal: number
  totalGuestMeal: number
  totalVeg: number
  totalNonVeg: number
  generatedAt: Date
  generatedBy: { name: string | null } | null
}

export async function getDailyMealCounts() {
  noStore()
  // Boarders see the counts; only staff see who produced them.
  const session = await requireUser()
  const canSeeGenerator = canManage(session.user.role)

  const todayStart = istCalendarDay()

  const rows = await prisma.dailyMealActivity.findMany({
    where: { date: todayStart },
    orderBy: { mealTime: "asc" },
    select: {
      mealTime: true,
      totalMeal: true,
      totalGuestMeal: true,
      totalVeg: true,
      totalNonvegChicken: true,
      totalNonvegFish: true,
      totalNonvegEgg: true,
      createdAt: true,
      generatedBy: {
        select: { name: true },
      },
    },
  })

  const slots: MealSlotCount[] = rows.map((r) => ({
    mealTime: r.mealTime,
    totalMeal: r.totalMeal,
    totalGuestMeal: r.totalGuestMeal,
    totalVeg: r.totalVeg,
    totalNonVeg: r.totalNonvegChicken + r.totalNonvegFish + r.totalNonvegEgg,
    generatedAt: r.createdAt,
    generatedBy: canSeeGenerator ? r.generatedBy : null,
  }))

  const totals = slots.reduce(
    (acc, s) => ({
      totalMeal: acc.totalMeal + s.totalMeal,
      totalGuestMeal: acc.totalGuestMeal + s.totalGuestMeal,
      totalVeg: acc.totalVeg + s.totalVeg,
      totalNonVeg: acc.totalNonVeg + s.totalNonVeg,
    }),
    { totalMeal: 0, totalGuestMeal: 0, totalVeg: 0, totalNonVeg: 0 }
  )

  return { date: todayStart, slots, totals, canSeeGenerator }
}

export type DailyMealCounts = Awaited<ReturnType<typeof getDailyMealCounts>>
