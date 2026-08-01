import { FinesSection } from "../../_components/user-section-tables"
import { getUserFines } from "../../_lib/user-detail"

export default async function UserFinesPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getUserFines(userId)
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Fines</h2>
      <FinesSection data={data} />
    </section>
  )
}
