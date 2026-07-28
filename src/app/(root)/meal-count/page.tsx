import { ChartBar as BarChart3 } from "@phosphor-icons/react/ssr"

import { PageContainer, PageHeader } from "@/components/page-container"

import { MealCountCards } from "./_components/meal-count-cards"
import { getDailyMealCounts } from "./_lib/action"

export default async function MealCountPage() {
  const data = await getDailyMealCounts()

  return (
    <PageContainer>
      <PageHeader
        icon={BarChart3}
        title="Meal Count"
        description="Today's total meals, guest meals and vegetarian counts."
      />
      <MealCountCards data={data} />
    </PageContainer>
  )
}
