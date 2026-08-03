import { MealTimeType } from "@/lib/generated/prisma"

// Moved to @/lib/meal-priority so guest meal booking and count generation
// share one chain. Re-exported here so existing imports keep working.
export {
  calculateActualNonVegMeal,
  getNonVegTypeFromItemName,
} from "@/lib/meal-priority"

export interface MealAttendanceToCreate {
  userId: string
  mealId: string
  mealTime: MealTimeType
  date: Date
}
