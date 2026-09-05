import "server-only"

import { MealTimeType, MealType } from "@/lib/generated/prisma"
import {
  assignBucket,
  offersForRecord,
  type MealBucket,
} from "@/lib/meal-priority"
import { getMessConfig } from "@/lib/mess-config"
import prisma from "@/lib/prisma"

export {
  BUCKET_LABELS,
  bucketsForOffers,
  type MealBucket,
} from "@/lib/meal-priority"

export interface MealBreakdownUser {
  id: string
  name: string | null
  image: string | null
  roomNo: string | null
}

/**
 * `date` must be the exact day-key of the DailyMealActivity row being
 * viewed (mealData.date), not "today" recomputed here — the caller may be
 * looking at a record from a different IST calendar day than the moment
 * this runs (stale client cache, a click right around midnight, etc.), and
 * re-deriving "today" independently silently queries the wrong day.
 */
export async function getMealBreakdownUsers(
  mealTime: MealTimeType,
  date: Date,
  bucket: MealBucket
): Promise<MealBreakdownUser[]> {
  const activity = await prisma.dailyMealActivity.findFirst({
    where: { mealTime, date },
    select: { offeredTypes: true, actualNonVegServed: true },
  })

  if (!activity) return []

  const attendances = await prisma.mealAttendance.findMany({
    where: { mealTime, date },
    select: {
      user: { select: { id: true, name: true, image: true, roomNo: true } },
      meal: {
        select: { type: true, nonVegType: true, dislikedNonVegTypes: true },
      },
    },
  })

  const { nonVegPriority } = await getMessConfig()

  // The day recorded what it was generated from, so buckets are reproduced
  // rather than recomputed off a menu the prefect may have edited since.
  const offers = offersForRecord(
    activity.offeredTypes,
    activity.actualNonVegServed,
    nonVegPriority
  )

  const matches = attendances.filter(({ meal }) => {
    if (!meal) return false

    // A pre-`offeredTypes` row that also recorded no tier cannot say what was
    // served: back then an unscheduled slot and a veg menu both stored null.
    // The old screen put every non-veg boarder in one generic bucket; keep
    // doing that so those records read as they always have.
    if (offers === null) {
      if (meal.type === MealType.VEG) return bucket === "VEG"
      return bucket === "CHICKEN"
    }

    return assignBucket(meal, offers) === bucket
  })

  return matches
    .map(({ user }) => user)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
}
