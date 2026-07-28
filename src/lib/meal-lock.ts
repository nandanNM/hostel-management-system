import "server-only"

import prisma from "@/lib/prisma"

export const MEAL_PREFERENCE_LOCK_MS = 2 * 60 * 60 * 1000

export const MEAL_PREFERENCE_LOCK_MESSAGE =
  "A meal was generated recently. You can update your meal preference after 2 hours."

export async function getMealPreferenceLock(): Promise<{
  locked: boolean
  unlockAt: string | null
}> {
  const latest = await prisma.dailyMealActivity.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })
  if (!latest) return { locked: false, unlockAt: null }

  const unlock = latest.createdAt.getTime() + MEAL_PREFERENCE_LOCK_MS
  const locked = Date.now() < unlock
  return { locked, unlockAt: locked ? new Date(unlock).toISOString() : null }
}
