import { BarChart3 } from "lucide-react"

import { getDailyMealCounts } from "./_lib/action"
import { MealCountCards } from "./_components/meal-count-cards"

export default async function MealCountPage() {
  const data = await getDailyMealCounts()

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meal Count</h1>
          <p className="text-muted-foreground mt-1">
            Today&apos;s total meals, guest meals and vegetarian counts.
          </p>
        </div>
      </div>

      <MealCountCards data={data} />
    </div>
  )
}
