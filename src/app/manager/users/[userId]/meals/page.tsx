import { MealsSection } from "../../_components/user-section-tables"
import { getUserMealHistory } from "../../_lib/user-detail"

export default async function UserMealsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getUserMealHistory(userId)
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Meal on/off history</h2>
      <MealsSection data={data} />
    </section>
  )
}
