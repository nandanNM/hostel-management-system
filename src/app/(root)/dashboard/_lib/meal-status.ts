import { MealStatusType } from "@/lib/generated/prisma"
import { getMealPreferenceLock } from "@/lib/meal-lock"
import prisma from "@/lib/prisma"

export interface MealStatusResult {
  status: MealStatusType | null
  locked: boolean
  unlockAt: string | null
}

export async function getMealStatusForUser(
  userId: string
): Promise<MealStatusResult> {
  const [data, lock] = await Promise.all([
    prisma.meal.findUnique({
      where: { userId },
      select: { status: true },
    }),
    getMealPreferenceLock(),
  ])

  return { status: data?.status ?? null, ...lock }
}
