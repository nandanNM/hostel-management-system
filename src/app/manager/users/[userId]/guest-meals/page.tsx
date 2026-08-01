import { GuestMealsSection } from "../../_components/user-section-tables"
import { getUserGuestMeals } from "../../_lib/user-detail"

export default async function UserGuestMealsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getUserGuestMeals(userId)
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Guest meals</h2>
      <GuestMealsSection data={data} />
    </section>
  )
}
