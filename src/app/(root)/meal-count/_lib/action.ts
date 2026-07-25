"use server"

import { unstable_noStore as noStore } from "next/cache"
import { startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"

import { MealTimeType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"

const TZ = "Asia/Kolkata"

export type MealSlotCount = {
  mealTime: MealTimeType
  totalMeal: number
  totalGuestMeal: number
  totalVeg: number
  totalNonVeg: number
}

export async function getDailyMealCounts() {
  noStore()
  await requireUser()

  const now = toZonedTime(new Date(), TZ)
  const todayStart = startOfDay(now)

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
    },
  })

  const slots: MealSlotCount[] = rows.map((r) => ({
    mealTime: r.mealTime,
    totalMeal: r.totalMeal,
    totalGuestMeal: r.totalGuestMeal,
    totalVeg: r.totalVeg,
    totalNonVeg: r.totalNonvegChicken + r.totalNonvegFish + r.totalNonvegEgg,
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

  return { date: todayStart, slots, totals }
}

export type DailyMealCounts = Awaited<ReturnType<typeof getDailyMealCounts>>
